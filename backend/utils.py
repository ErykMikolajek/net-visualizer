def parse_tensorflow_file(file_path, original_filename):
    import tensorflow as tf
    import json

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

    