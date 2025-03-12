def parse_tensorflow_file(file_path):
    import tensorflow as tf
    import json

    model = tf.keras.models.load_model(file_path, compile=False)

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

    