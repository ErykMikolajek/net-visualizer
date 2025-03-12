FROM python:3.11

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install -r /code/requirements.txt

COPY ./app.py /code/
COPY ./utils.py /code/

EXPOSE 4000

CMD ["fastapi", "run", "app.py", "--port", "4000"]