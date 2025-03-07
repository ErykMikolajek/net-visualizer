from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from os import environ

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "supports_credentials": True
    }
})

# Test route to validate api
@app.route('/api/test', methods=['GET'])
def test():
  return make_response(jsonify({'message': 'test route'}), 200)

# pytorch model endpoint
@app.route('/api/pytorch', methods=['POST'])
def process_pytroch():
    if 'file' not in request.files:
        return make_response(jsonify({'error': 'No file provided'}), 400)
    
    file = request.files['file']
    if file.filename == '':
        return make_response(jsonify({'error': 'No file selected'}), 400)
        
    filename = file.filename
    # filetype = type(file)
    return make_response(jsonify({'message': filename}), 200)


# TODO: separate route for different filetypes