from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from os import environ

app = Flask(__name__)
CORS(app)

# Test route to validate api
@app.route('/api/test', methods=['GET'])
def test():
  return make_response(jsonify({'message': 'test route'}), 200)

# TODO: separate route for different filetypes
