FROM python:3.11

WORKDIR /app

COPY requirements.txt ./

# RUN pip install --no-binary h5py h5py
RUN pip install -r requirements.txt

COPY . .

ENV FLASK_APP=app.py
ENV FLASK_ENV=development

EXPOSE 4000

CMD [ "flask", "run", "--host=0.0.0.0", "--port=4000"]
