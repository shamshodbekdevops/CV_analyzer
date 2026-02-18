FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app
RUN chmod +x /app/start-web.sh /app/start-worker.sh
RUN ln -sf /app/start-web.sh /usr/local/bin/start-web.sh && \
    ln -sf /app/start-worker.sh /usr/local/bin/start-worker.sh

CMD ["/app/start-web.sh"]
