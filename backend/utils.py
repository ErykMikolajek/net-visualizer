
# def parse_pytroch_file(file):
#     import torch

#     out = ""
#     model_data = torch.load(file.stream, map_location="cpu")
#     # print(model_data)    
#     for key, value in model_data.items():
#         print(key)
#         # out = out.join(key)
#     print(out)

#     return "response"


def parse_tensorflow_file(file):
    import tempfile
    import tensorflow as tf
    import json
    import os

    with tempfile.NamedTemporaryFile(suffix='.h5', delete=False) as temp:
        file.save(temp.name)
        temp_path = temp.name

    try:
        model = tf.keras.models.load_model(temp_path, compile=False)
        
        model_info = {
            'model_name': model.name,
            'total_params': model.count_params(),
            'layers': []
        }
    
        for layer in model.layers:
            layer_info = {
                'name': layer.name,
                'type': layer.__class__.__name__,
                'output_shape': '',
            }
            if hasattr(layer, 'output_shape'):
                layer_info['output_shape'] = str(layer.output_shape)
            # print(layer.get_config())
            model_info['layers'].append(layer_info)
        
        return json.dumps(model_info)
    except Exception as e:
        return f"Error loading model: {str(e)}"
    finally:
        os.unlink(temp_path)
    