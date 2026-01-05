import os
# CRITICAL: Set these BEFORE importing TensorFlow/PyTorch to avoid OpenMP/MKL conflicts
# These prevent deadlocks when both frameworks are used in the same process
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['VECLIB_MAXIMUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'
# Disable TensorFlow's oneDNN optimizations which can conflict with PyTorch
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import tensorflow as tf
import json
import torch
import torch.nn as nn
import importlib
import numpy as np
from PIL import Image
import glob

models_dir = "/app/uploads/models"

def parse_tensorflow_file(file_path, original_filename, img_width: int = 28, img_height: int = 28, img_channels: int = 1):

    model = tf.keras.models.load_model(file_path, compile=False)

    # Layer types to skip in visualization
    SKIP_LAYER_TYPES = {"BatchNormalization", "Dropout", "SpatialDropout1D", "SpatialDropout2D", "SpatialDropout3D"}

    model_info = {
        'model_name': model.name,
        'model_filename': original_filename,
        'total_params': model.count_params(),
        'layers': []
    }

    input_shape = (None, img_height, img_width, img_channels)
    model_info['layers'].append({
        'name': 'input',
        'type': 'InputLayer',
        'output_shape': str(input_shape)
    })

    for layer in model.layers:
        layer_type = layer.__class__.__name__
        
        # Skip batch normalization and dropout layers
        if layer_type in SKIP_LAYER_TYPES:
            continue
            
        layer_info = {
            'name': layer.name,
            'type': layer_type,
            'output_shape': '',
        }
        if hasattr(layer, 'output_shape'):
            print("HAS ATTRIBUTE:", layer.output_shape)
            layer_info['output_shape'] = str(layer.output_shape)
        else:
            input_shape = layer.compute_output_shape(input_shape)
            layer_info['output_shape'] = str(input_shape)
        # print(layer.get_config())
        model_info['layers'].append(layer_info)
    
    return json.dumps(model_info)

def parse_pytorch_file(file_path, original_filename):
    model = None
    try:
        # Load model and ensure it's on CPU to avoid GPU memory issues
        model = torch.load(file_path, weights_only=False, map_location='cpu')
    except Exception as e:
        raise ValueError(f"Error loading PyTorch model: {e}")
    
    if not isinstance(model, nn.Module):
        raise ValueError("The loaded model is not a valid PyTorch nn.Module.")
    
    try:
        # Explicitly move model to CPU (in case it was saved on GPU)
        model = model.to('cpu')
        model.eval()  # Set the model to evaluation mode

        layer_info = []
        SKIP_LAYER_TYPES = {"ReLU", "BatchNorm2d", "BatchNorm1d", "BatchNorm3d", "Dropout", "Dropout2d", "Dropout3d"}

        def normalize_layer_type(layer_type: str) -> str:
            mapping = {
                "Linear": "Dense",
                "Conv2d": "Conv2D",
                "MaxPool2d": "MaxPooling2D",
                "Flatten": "Flatten",
            }
            return mapping.get(layer_type, layer_type)  # fallback to original if unknown
        
        def convert_shape_to_nhwc(shape):
            # Convert from NCHW to NHWC format
            if len(shape) == 4:  # Only convert if it's a 4D tensor (NCHW)
                n, c, h, w = shape
                return (n, h, w, c)
            return shape
        
        def hook_fn(module, input, output):
            layer_type = module._get_name()
            if layer_type in SKIP_LAYER_TYPES:
                return

            output_shape = tuple(output.shape) if hasattr(output, "shape") else None
            if output_shape:
                output_shape = convert_shape_to_nhwc(output_shape)

            layer_info.append({
                'name': layer_type,
                'type': normalize_layer_type(module._get_name()),
                'output_shape': str(output_shape) if output_shape else None
            })
            print(f"Layer: {layer_type}, Output shape: {output_shape}")

        hooks = []
        for name, module in model.named_modules():
            if len(list(module.children())) == 0:  # Skip containers
                h = module.register_forward_hook(hook_fn)
                hooks.append(h)

        # Create dummy input in NCHW format (PyTorch's native format) on CPU
        dummy_input = torch.randn(1, 1, 128, 128, device='cpu')
        try:
            with torch.no_grad():  # Disable gradient computation to save memory
                model(dummy_input)
        except Exception as e:
            raise RuntimeError(f"Error during model inference: {e}")
        finally:
            # Always remove hooks, even if inference fails
            for h in hooks:
                h.remove()
            # Clean up dummy input
            del dummy_input

        print("Layer info collected:", layer_info)

        model_info = {
            'model_name': model.__class__.__name__,
            'model_filename': original_filename,
            'total_params': sum(p.numel() for p in model.parameters()),
            'layers': layer_info
        }

        return json.dumps(model_info)
    finally:
        # Explicitly clean up model and clear CUDA cache if available
        if model is not None:
            del model
        # Clear CUDA cache to free GPU memory if CUDA was used
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


def run_inference(file_path, original_filename, model_name: str, img_width: int = 28, img_height: int = 28, img_channels: int = 1):
    model_name = os.path.join(models_dir, model_name)
    model_loaded = tf.keras.models.load_model(model_name, compile=False)
    
    # Layer types to skip in visualization (same as parse_tensorflow_file)
    SKIP_LAYER_TYPES = {"BatchNormalization", "Dropout", "SpatialDropout1D", "SpatialDropout2D", "SpatialDropout3D"}
    
    img = Image.open(file_path)
    img = img.resize((img_width, img_height), Image.Resampling.LANCZOS)
    
    if img_channels == 1:
        img = img.convert('L')
        sample_image = np.array(img).reshape(1, img_height, img_width, 1)
    elif img_channels == 3:
        img = img.convert('RGB')
        sample_image = np.array(img).reshape(1, img_height, img_width, 3)
    else:
        img = img.convert('L')
        img_arr = np.array(img)
        sample_image = np.stack([img_arr] * img_channels, axis=-1).reshape(1, img_height, img_width, img_channels)
    
    sample_image = sample_image.astype(np.float32) / 255.0

    input_shape = model_loaded.input_shape[1:]
    new_input = tf.keras.Input(shape=input_shape)

    x = new_input
    outputs = []
    layers_to_include = []
    for layer in model_loaded.layers:
        x = layer(x)
        layer_type = layer.__class__.__name__
        # Only collect outputs for layers that are not skipped
        if layer_type not in SKIP_LAYER_TYPES:
            outputs.append(x)
            layers_to_include.append(layer)

    activation_model = tf.keras.Model(inputs=new_input, outputs=outputs)
    activations = activation_model.predict(sample_image)

    activations_dict = {}
    for layer, activation in zip(layers_to_include, activations):
        activations_normalized = (activation - activation.min()) / (activation.max() - activation.min() + 1e-10)
        activations_dict[layer.name] = activations_normalized.tolist()
    return json.dumps(activations_dict)