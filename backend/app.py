from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import json
import os
import shutil
import utils

app = FastAPI()

MODELS_DIR = "/app/uploads/models"
IMAGES_DIR = "/app/uploads/images"

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clear_directory(directory: str):
    """ Clear all files in the specified directory."""
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Error deleting {file_path}: {e}")

async def save_file_with_original_name(file: UploadFile, directory: str) -> str:
    """ Save the uploaded file with its original filename after clearing the directory. """
    clear_directory(directory)
    file_path = os.path.join(directory, file.filename)
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    return file_path

@app.post("/tensorflow")
async def process_tensorflow(
    file: UploadFile,
    img_width: int = Form(28),
    img_height: int = Form(28),
    img_channels: int = Form(1)
):
    try:
        file_path = await save_file_with_original_name(file, MODELS_DIR)
        return json.loads(utils.parse_tensorflow_file(file_path, file.filename, img_width, img_height, img_channels))
    except Exception as e:
        return {"error": f"Error loading model: {str(e)}"}

@app.post("/inference")
async def process_inference(
    file: UploadFile, 
    model_name: str = Form(...),
    img_width: int = Form(28),
    img_height: int = Form(28),
    img_channels: int = Form(1)
):
    try:
        file_path = await save_file_with_original_name(file, IMAGES_DIR)
        return json.loads(utils.run_inference(file_path, file.filename, model_name, img_width, img_height, img_channels))
    except Exception as e:
        return {"error": f"Error running inference: {str(e)}"}

@app.post("/pytorch")
async def process_pytorch(file: UploadFile):
    try:
        file_path = await save_file_with_original_name(file, MODELS_DIR)
        result = utils.parse_pytorch_file(file_path, file.filename)
        print(f"PyTorch parse result: {result[:200] if result else 'None'}...")
        return json.loads(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Error loading model: {str(e)}"}
