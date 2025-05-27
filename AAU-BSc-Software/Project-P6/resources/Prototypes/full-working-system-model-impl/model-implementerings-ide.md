1) Tag billede ved waypoint
2) Lav json object med disse variabler:

{
    "billede": "<path af billede>",
    "gps data": 
    {
        "lat": "float"
        "lon": "float"
    },
    "detected": true/false
}

3) Send json objektet til thread der køre yolo modellen på billedet referet i json objektet
4) Hvis der bliver detected objekter i billedet, så ændre "detected" variablen til true
5) Emit via socket til frontend.