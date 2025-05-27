# Net Visualizer

**Net Visualizer** is a web application designed for uploading, processing, and visualizing neural netowork model files. It includes:

- 🧠 A **Python FastAPI backend** for file handling and data processing
- 🌐 A **React-based frontend built with Next.js using THREE.js for model visualization**
- 🐳 Fully containerized backend with **Docker Compose**

---

## 📁 Project Structure
```
├── backend/ # FastAPI backend  
│ ├── app.py  
│ ├── utils.py  
│ ├── requirements.txt  
│ └── Dockerfile  
├── src/app/  
│ ├── components/  
│ └── lib/  
├── test_models/  
├── compose.yaml   
├── package.json  
└── README.md
```

---

## 🚀 Getting Started with Docker Compose

### ✅ Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/)

### ▶️ Run the full app (backend + frontend)

1. Clone the repository:

   ```bash
   git clone https://github.com/ErykMikolajek/net-visualizer.git
   cd net-visualizer
    ```

2. Start all services:  
   Frontend:
   ```bash
    npm run dev
    ```
   Backend:
    ```bash
    docker compose up --build
    ```

4. Open in your browser:  
Frontend → http://localhost:3000  

## 🧠 Backend – FastAPI

The backend is built with FastAPI and handles:
* File uploads
* Data parsing and processing
* Serving results to the frontend


### ✅ Backend Dockerfile
    
    FROM python:3.11

    WORKDIR /code

    COPY ./requirements.txt /code/requirements.txt
    RUN pip install --no-cache-dir -r /code/requirements.txt

    COPY ./app.py /code/
    COPY ./utils.py /code/

    EXPOSE 4000

    CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "4000"]


## 🌐 Frontend – Next.js + THREE.js

The frontend is built with **Next.js** and provides the model visualization using THREE.js
