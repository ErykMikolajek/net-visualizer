from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import os
import tempfile

import utils

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/test")
def test():
    return {"Test": "message"}

@app.post("/tensorflow")
async def process_tensorflow(file: UploadFile):

    with tempfile.NamedTemporaryFile(delete=False, suffix='.h5') as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        return json.loads(utils.parse_tensorflow_file(temp_file_path, file.filename))
        
    except Exception as e:
        return {"error": f"Error loading model: {str(e)}"}
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@app.post("/pytorch")
async def process_pytorch(file: UploadFile):
    with tempfile.NamedTemporaryFile(delete=False, suffix='.h5') as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    model_info = utils.parse_pytorch_file(temp_file_path, file.filename)
    # print("Parsed model:", model_info)
    # print("Type:", type(model_info))

    return model_info