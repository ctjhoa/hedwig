#!/usr/bin/env python
import pika

connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
channel = connection.channel()

channel.queue_declare(queue='hello', durable=True, auto_delete=True)

channel.basic_publish(exchange='',
                      routing_key='hello',
                      body='{"templateName": "test.html", "data": {"toto": "titi"}}')
connection.close()
