import tensorflow as tf
import json
import os
import torch
import torch.nn as nn
import importlib

def parse_tensorflow_file(file_path, original_filename):

    model = tf.keras.models.load_model(file_path, compile=False)

    model_info = {
        'model_name': model.name,
        'model_filename': original_filename,
        'total_params': model.count_params(),
        'layers': []
    }

    input_shape = (None, 128, 128, 1)
    model_info['layers'].append({
        'name': 'assumed_input_shape',
        'type': 'InputLayer',
        'output_shape': str(input_shape)
    })

    for layer in model.layers:
        layer_info = {
            'name': layer.name,
            'type': layer.__class__.__name__,
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
    # Placeholder for PyTorch model parsing logic
    # You can implement this function based on your requirements

    try :
        model = torch.load(file_path, weights_only=False)
    except Exception as e:
        raise ValueError(f"Error loading PyTorch model: {e}")
    
    if not isinstance(model, nn.Module):
        raise ValueError("The loaded model is not a valid PyTorch nn.Module.")
    
    else:
        model.eval()  # Set the model to evaluation mode

        layer_info = []
        SKIP_LAYER_TYPES = {"ReLU"}

        def normalize_layer_type(layer_type: str) -> str:
            mapping = {
                "Linear": "Dense",
                "Conv2d": "Conv2D",
                "MaxPool2d": "MaxPooling2D",
                "Flatten": "Flatten",
            }
            return mapping.get(layer_type, layer_type)  # fallback to original if unknown
        
        def hook_fn(module, input, output):
            layer_type = module._get_name()
            if layer_type in SKIP_LAYER_TYPES:
                return

            layer_info.append({
                'name': layer_type,
                'type': normalize_layer_type(module._get_name()),
                'output_shape': str(tuple(output.shape)) if hasattr(output, "shape") else None
            })
            print(f"Layer: {layer_type}, Output shape: {output.shape}")

        hooks = []
        for name, module in model.named_modules():
            if len(list(module.children())) == 0:  # Pomijamy kontenery
                h = module.register_forward_hook(hook_fn)
                hooks.append(h)

        dummy_input = torch.randn(1, 1, 128, 128)  # Adjust the input shape as needed
        try:
            model(dummy_input)
        except Exception as e:
            raise RuntimeError(f"Error during model inference: {e}")
        
        for h in hooks:
            h.remove()

        print("Layer info collected:", layer_info)

        model_info = {
            'model_name': model.__class__.__name__,
            'model_filename': original_filename,
            'total_params': sum(p.numel() for p in model.parameters()),
            'layers': layer_info
        }

    return model_info