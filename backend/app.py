from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import json
import os
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

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

# Create a directory to store GLB files if it doesn't exist
GLB_STORAGE_DIR = Path("glb_storage")
GLB_STORAGE_DIR.mkdir(exist_ok=True)

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

@app.post("/upload")
async def upload_glb(file: UploadFile):
    try:
        # Create a unique filename using the original filename
        file_path = GLB_STORAGE_DIR / file.filename
        
        # Save the file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"message": "GLB file uploaded successfully", "filename": file.filename}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error uploading GLB file: {str(e)}"}
        )

@app.get("/download-latest")
async def download_latest_glb():
    try:
        # Get all GLB files in the storage directory
        glb_files = list(GLB_STORAGE_DIR.glob("*.glb"))
        
        if not glb_files:
            return JSONResponse(
                status_code=404,
                content={"error": "No GLB files found"}
            )
        
        # Get the most recent file based on modification time
        latest_file = max(glb_files, key=lambda x: x.stat().st_mtime)
        
        return FileResponse(
            path=latest_file,
            filename=latest_file.name,
            media_type="model/gltf-binary"
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error downloading GLB file: {str(e)}"}
        )