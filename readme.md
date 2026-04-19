Sistema bancario serverless construido con AWS y Terraform.

## Servicios utilizados

- AWS Lambda
- API Gateway
- DynamoDB
- S3
- SQS

## Arquitectura

Arquitectura basada en microservicios y eventos utilizando colas de mensajería.


lo que se agrego nuevo fue
APIS Y LAMBDAS DE CATALOG Y PAYMENT
para probar las apis en postman

GET CATALOG
https://67iukiltfg.execute-api.us-east-1.amazonaws.com/dev/catalog

payment

POST https://67iukiltfg.execute-api.us-east-1.amazonaws.com/dev/payment

{
  "cardId": "99ce1036-e2de-489d-936d-c3de13819143",
  "service": {
    "id": 2,
    "categoria": "Energía",
    "proveedor": "Empresa Eléctrica Nacional",
    "servicio": "Luz Residencial",
    "plan": "Premium",
    "precio_mensual": 75000,
    "detalles": "300 kWh incluidos",
    "estado": "Activo"
  }
}

para probar el front usar la url http://payment-frontend-emerson.s3-website-us-east-1.amazonaws.com/

