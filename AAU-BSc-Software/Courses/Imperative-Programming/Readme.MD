# Imperative Programming

Imperative programming is a paradigm of computer programming where the program describes steps that change the state of the computer.

### Language

Doing this course we used the C Programming Language

### IDE

For this project, the 'Clion' Integrated Development Environment (IDE) by JetBrains was utilized. 'Clion' is a cross-platform IDE that is specifically designed for C and C++ development. It offers a range of features including code navigation, code refactoring, debugging, and code completion, which make it a powerful tool for developing C and C++ applications. 'Clion' also integrates with popular build systems such as CMake and Gradle, allowing for easy compilation and execution of projects. Overall, 'Clion' proved to be a reliable and efficient choice for this project.

### Literature

Problem Solving and Program Design in C - Eigth Edition

### C History

C was developed by Dennis Tichie in 1972 at AT&T Bell Labs in the USA. Historically it's connected to the UNIX operating system. Many other programming languages are inspired by C.

### Top-Down Design with Functions

In software development, top-down design is a method of designing and building a program by breaking it down into smaller, more manageable pieces. This approach allows you to build a program incrementally, starting with the big picture and then working your way down to the details.

Top-down design involves breaking the program into smaller functions, each of which performs a specific task. This allows you to reuse code and make your program more modular and easier to maintain.

### Prototypes

In C, a prototype is a declaration of a function that specifies the function's name, return type, and parameter list. Prototypes are used to inform the compiler about the functions that are used in a program, so that the compiler can check that the function calls are valid and generate the correct code.

Prototypes are typically placed in a header file or at the top of a source file before the main function.

Handin3.c:

```c
//Prototype at the top of the program
double trap(double, double, int, binary_f, function_flag);
...
double trap(double a, double b, int n, binary_f f, function_flag flag)
{
    //h = (b-a)/n
    double h = (b-a)/n, area;

    //Function pointer to the sum function
    double (*sum_ptr)(double, double, int, binary_f, function_flag) = &sum;

    //Invoking the function pointer and assigning its result to a variable
    double sum = (*sum_ptr)(a, h, n, f, flag);

    //T=(h/2)*(f(a) + f(b) + 2 * (sum [i=1 ... n] f(x_i) )
    area = (h/2) * (f(a, flag) + f(b, flag) + 2 * sum);

    return area;
}
```

### Library Functions

"Predefined Functions and Code Reuse: A primary goal of software engineering is to write error-free code. Code reuse, reusing program fragments that have already been written and tested whenever possible, is one way to accomplish this goal. Stated more simply, “Why reinvent the wheel?” C promotes reuse by providing many predefined functions that can be used to perform mathematical computations. C’s standard math library defines a function named sqrt that performs the square root computation. The function call in the assignment statement" - *Problem Solving and Program Design in C*

### Examples:

- math.h
- stdio.h
- stdlib.h
- stdbool.h etc..

## Danish Notes from Lectures

### **Lektion 2: Introduktion til C (9.9.2022)**

Lektion 2 er en introduktion til C programmering. Emnerne, der vil blive dækket, inkluderer variable, erklæringer og initialisering.

Variabler er steder i computerhukommelsen, hvor data kan gemmes og tilgås. For at kunne bruge en variabel i et C-program, skal den først erklæres. Erklæringen giver information om, hvad slags data variablen vil indeholde, og hvad den skal hedde. For eksempel kan en variabel erklæres som en int (heltal) med navnet "a".

Initialisering er at give en variabel en startværdi, når den erklæres. Dette kan gøres ved at tildele en værdi til variablen i erklæringen. For eksempel kan variablen "a" initialiseres med værdien 5 ved at skrive "int a = 5;".

Assignments er brugt til at tildele en værdi til en eksisterende variabel. For eksempel kan værdien af variablen "a" ændres til 10 ved at skrive "a = 10;".

I C-programmer findes der flere forskellige datatyper, som kan bruges til at erklære variable med. Nogle almindelige eksempler er int (heltal), float (decimal), char (karakter) og andre. Hver datatype har sine egne specifikationer og begrænsninger.

Udtryk og operatorer bruges til at udføre beregninger og sammenligninger i et program. Operatorerne kan være matematiske (+, -, *, /) eller logiske (==, !=, >, <). Operator prioritering bestemmer rækkefølgen af operationerne i et udtryk. For eksempel vil multiplikation og division normalt blive udført før addition og subtraktion. Associering bestemmer hvordan operatorerne samarbejder i et udtryk. For eksempel vil operatorerne i et udtryk normalt blive evalueret fra venstre mod højre.

Så til sidst, printf og scanf er bibliotekfunktioner, der bruges til at udskrive og indlæse data fra brugeren. printf bruges til at udskrive en tekststreng eller en variabel på skærmen, mens scanf bruges til at læse input fra brugeren og gemme det i en variabel. Disse funktioner er vigtige for at lave interaktive programmer, der kan kommunikere med brugeren.

### **Lektion 3: Selektive kontrolstrukturer (14.9.2022)**

I denne lektion har vi studeret selektive kontrolstrukturer i C-programmering. Vi har set på logiske udtryk og boolean datatypen, som kan evalueres til enten sandt eller falsk. Vi har set på if-statements, som giver mulighed for at udføre en bestemt handling, hvis en bestemt betingelse er opfyldt.

```c
int a = 5;
if (a > 3) {
    printf("a is greater than 3\n");
}
```

Her vil det udskrive "a is greater than 3" fordi a er større end 3.

Vi har også set på switch-statements, som giver mulighed for at udføre forskellige handlinger baseret på forskellige værdier af en bestemt variabel.

```c
char grade = 'B';
switch(grade) {
    case 'A':
        printf("Excellent!\n");
        break;
    case 'B':
        printf("Good job!\n");
        break;
    case 'C':
        printf("You passed!\n");
        break;
    default:
        printf("Invalid grade\n");
}
```

Her vil det udskrive "Good job!" fordi grade er sat til 'B'.

Vi har også introduceret begrebet blokke og scoperegler. En blok er en sektion af koden, der er omsluttet af krøllede parenteser "{}". Scoperegler bestemmer, hvilke variable og funktioner, der er tilgængelige i en bestemt blok eller sektion af koden.

```c
int x = 10;
{
    int y = 5;
    printf("x + y = %d\n", x + y);
}
printf("x = %d\n", x);
```

Her vil det første printf udskrive "x + y = 15" og det andet udskrive "x = 10" fordi x er tilgængelig i hele programmet, men y kun er tilgængelig i den første blok.

Alt i alt har vi set på de forskellige selektive kontrolstrukturer, der er tilgængelige i C, og hvordan de kan anvendes i koden for at gøre det mere interaktivt og effektivt.

### **Lektion 4: Iterative kontrolstrukturer  (16.9.2022)**

I denne lektion har vi studeret iterative kontrolstrukturer i C-programmering. Disse strukturer giver mulighed for at gentage en sektion af koden, indtil en bestemt betingelse er opfyldt.

Vi har set på while-løkker, som giver mulighed for at udføre en handling, så længe en bestemt betingelse er opfyldt.

```c
int i = 0;
while (i < 10) {
    printf("%d ", i);
    i++;
}
```

Her vil det udskrive tal fra 0 til 9 fordi i starter fra 0 og øges med 1 indtil det er 10.

Vi har også set på for-løkker, som giver mulighed for at definere start- og stop-betingelser, samt hvordan tælleren skal ændres efter hver iteration.

```c
for (int i = 0; i < 10; i++) {
    printf("%d ", i);
}
```

Her vil det også udskrive tal fra 0 til 9 fordi i starter fra 0, stopper ved 9 og øges med 1 efter hver iteration.

Vi har set på do-while-løkker, som er ens i forhold til while-løkker, men forskellen er at do-while-løkken mindst kører 1 gang, uanset om betingelsen er opfyldt eller ej.

```c
int i = 0;
do {
    printf("%d ", i);
    i++;
} while (i < 10);
```

Her vil det også udskrive tal fra 0 til 9 fordi i starter fra 0 og øges med 1 indtil det er 10.

Vi har også set på Euclids algoritme, som er en metode til at finde den største fælles divisor (GCD) mellem to tal.

```c
int gcd(int a, int b) {
    if (b == 0)
        return a;
    return gcd(b, a % b);
}
```

Her kan man bruge den ved at skrive:

```c
printf("GCD of 60 and 48 is %d", gcd(60, 48));
```

Her vil det udskrive GCD of 60 and 48 is 12, da 12 er den største fælles divisor mellem 60 og 48.

Vi har også set på kommaoperatoren, som kan anvendes i for-løkker for at udføre flere handlinger i en enkelt iteration.

Vi har også set på klassificeringen af gentagelser, som kan være enten definite eller udefinerede. Definite gentagelser ved, hvor mange gange de skal køre, mens udefinerede gentagelser kører, indtil en bestemt betingelse er opfyldt.

Vi har også set på hop med break og continue. Break bruges til at bryde ud af en løkke eller et switch-statement tidligere end normalt, mens continue bruges til at springe over en iteration og gå direkte til den næste.

```c
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break;
    }
    printf("%d ", i);
}
```

Her vil det udskrive tal fra 0 til 4, fordi break bryder ud af løkken, når i når 5.

```c
for (int i = 0; i < 10; i++) {
    if (i % 2 == 0) {
        continue;
    }
    printf("%d ", i);
}
```

Her vil det udskrive tal fra 1 til 9, fordi continue springer over alle lige tal, så kun ulige tal bliver udskrevet.

Alt i alt har vi set på de forskellige iterative kontrolstrukturer, der er tilgængelige i C, og hvordan de kan anvendes i koden for at gøre det mere effektivt og automatisere Gentagende opgaver. Vi har også set på Euclids algoritme, komma operatoren, klassificering af gentagelser, hop med break og continue, som er nyttige værktøjer for at skrive komplekse og effektive programmer.

### **Lektion 5: Funktioner og top-down programmering (21.9.2022)**

I denne lektion har vi studeret brugen af funktioner og top-down programmering i C-programmering. Funktioner giver mulighed for at opdele et program i mindre, genanvendelige dele, hvilket gør det nemmere at forstå og vedligeholde.

Vi har set på procedurer og funktioner, som er to former for funktioner i C. Procedurer er funktioner, der ikke returnerer nogen værdi, mens funktioner returnerer en værdi.

Vi har også set på abstraktion, som er evnen til at se bort fra detaljer og koncentrere sig om de vigtigste aspekter af et problem. Dette gør det nemmere at forstå og løse komplekse problemer ved at bryde dem ned i mindre dele.

Vi har set på call by value parametre, som er en metode til at sende input parametre til en funktion. Dette giver mulighed for at sende kopier af variable i stedet for originalerne, så funktionen ikke ændrer værdien af de originale variable.

Vi har også set på top-down programudvikling ved trinvis forfinelse. Dette er en metode, hvor et program er opdelt i mindre dele og hver del er skrevet og testet separat, før de samles til det færdige program. Dette gør det nemmere at identificere og løse fejl i koden.

Vi har også set på del og hersk (del og kombiner) metoden, som er en måde at løse komplekse problemer på ved at bryde dem ned i mindre dele og derefter løse hver del separat, før de kombineres til den endelige løsning.

Alt i alt har vi i denne lektion set på, hvordan funktioner kan anvendes til at gøre koden mere overskuelig og effektiv, ved at opdele den i mindre, genanvendelige dele. Vi har også set på metoder til at løse komplekse problemer ved hjælp af abstraktion, top-down programmering og del og hersk metoden.

### **Lektion 6: Funktioner og parametre (7.10.2022)**

I denne lektion har vi introduceret begrebet pointere i C-programmering. Pointere er variable, der gemmer en adresse i hukommelsen og giver mulighed for at referere til en anden variable.

Vi har set på call by reference parametre, som er en metode til at sende output parametre til en funktion. Dette giver mulighed for at ændre værdien af de originale variable inde i funktionen. 

```c
void add(int *x, int *y) {
    *x = *x + *y;
}
```

Her kan man bruge den ved at skrive:

```c
int a = 3, b = 4;
add(&a, &b);
printf("%d", a);
```

Her vil det udskrive 7, fordi funktionen adder b til x og gemmer det i x.

Vi har også set på pointere til funktioner, som giver mulighed for at gemme adressen på en funktion i en pointervariabel, og derefter bruge den til at kalde funktionen. Dette kan være nyttigt i situationer, hvor man ønsker at gemme en funktion i en variabel og derefter kalde den senere eller vælge en funktion baseret på en bestemt betingelse.

Alt i alt har vi i denne lektion set på, hvordan pointere og call by reference parametre kan anvendes i C-programmering for at gøre koden mere fleksibel og effektiv. Pointere giver mulighed for at referere til andre variable, mens call by reference parametre giver mulighed for at ændre værdien af de originale variable inde i funktionen og pointere til funktioner giver mulighed for at gemme en funktion i en variabel og derefter kalde den senere eller vælge en funktion baseret på en bestemt betingelse.

### **Lektion 7: Arrays og Pointere (3.10.2022)**

I denne lektion har vi set på brugen af arrays og pointere i C-programmering, med både eksempler og forklaringer.

Vi har set på arrays i én og flere dimensioner. En en-dimensional array er en liste af variable af samme datatype, der er organiseret som en række. En multi-dimensional array er en liste af variable organiseret som en matrice. For eksempel:

```c
int oneDimensionalArray[5] = {1, 2, 3, 4, 5}; // En en-dimensional array med plads til 5 integer
int twoDimensionalArray[3][3] = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}; // En to-dimensional array med plads til 3x3 integer
```

Vi har også set på forholdet mellem pointere og arrays. Et array kan betragtes som en type pointer, da et arraynavn i C-programmering er en pointer til den første element i arrayet. Dette giver mulighed for at bruge pointere til at referere til og manipulere data i arrays. For eksempel:

```c
int array[5] = {1, 2, 3, 4, 5};
int *p = array; // p er en pointer variabel, som peger på første element i arrayet
printf("%d", *p); // udskriver 1, som er værdien af det første element i arrayet
```

Vi har set på pointeraritmetik, som er metoderne til at navigere og manipulere data i arrays ved hjælp af pointere. Dette inkluderer, at bruge pointere til at få adgang til en bestemt element i et array og til at navigere gennem et array. For eksempel:

```c
int array[5] = {1, 2, 3, 4, 5};
int *p = array; // p peger på første element i arrayet
p = p + 2; // p peger nu på 3. element i arrayet
printf("%d", *p); // udskriver 3
```

Vi har også set på sortering af arrays, som er metoder til at organisere data i et array i en bestemt rækkefølge. Der er flere algoritmer til at sortere arrays, som kan vælges afhængigt af det specifikke problem. For eksempel ved at bruge en algoritme som Bubblesort:

```c
void bubbleSort(int arr[], int n)
{
    int i, j;
    for (i = 0; i < n-1; i++)

       // Last i elements are already in place
       for (j = 0; j < n-i-1; j++)
           if (arr[j] > arr[j+1])
              swap(&arr[j], &arr[j+1]);
}
```

Vi har også set på både statisk og dynamisk allokering af lager, hvor statisk allokering er allokering af lager på forhånd, mens dynamisk allokering er allokering af lager under kørselstiden. For eksempel, statisk allokering:

```c
int array[5];
```

Dynamisk allokering:

```c
int *array = (int *) malloc(5 * sizeof(int));
```

Alt i alt har vi i denne lektion set på, hvordan arrays og pointere kan anvendes i C-programmering for at gemme og organisere data. Vi har set på forholdet mellem pointere og arrays, pointeraritmetik, sortering af arrays, og forskellige metoder til allokering af lager. Dette er vigtige værktøjer for at skrive effektive og organiseret kode, som kan håndtere store mængder data.
Dynamisk allokering giver mulighed for at allokere lager efter behov, men det kræver også at frigøre lager manuelt når det ikke længere er brugt med free() funktionen.

```c
free(array);
```

Dette er vigtigt at huske for at undgå memory leaks og for at optimere brugen af hukommelsen i programmet.

### **Lektion 8: Datatyper og Test (26.10.2022)**

I denne lektion har vi set på datatyper og test i C-programmering.
Vi har set på en oversigt over de forskellige datatyper i C, herunder de primitive datatyper som int, char, og float, samt de mere avancerede datatyper som pointers, arrays, og structs.
Vi har også set på enumeration typer, som giver mulighed for at give navne til konstanter og gøre koden mere læsbar. 

```c
enum Weekday {Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday};
```

Vi har set på typedefinitioner, som giver mulighed for at give et alias til en eksisterende datatype.

```c
typedef unsigned int uint;
```

Vi har også set på type casts, som giver mulighed for at konvertere en variabel fra en datatype til en anden.

```c
int a = 5;
float b = (float) a;
```

Vi har set på scope, som er området hvor en variabel eller funktion er synlig.
Vi har set på tilfældige tal, som giver mulighed for at generere tilfældige tal i koden.

```c
#include <stdlib.h>
#include <time.h>

srand(time(0));
int randomNumber = rand() % 100;
```

Vi har set på systematisk programtest og introduktion til debugging. Dette inkluderer metoder til at teste programmet for fejl og metoder til at finde og rette fejl i koden.

Vi har set på systematisk programtest og introduktion til debugging. Dette inkluderer metoder til at teste programmet for fejl og metoder til at finde og rette fejl i koden. En af metoderne, som er at bruge tilfældige tal i testen, kan være ved at generere tilfældige tal og bruge dem som input til programmet for at teste hvordan det reagerer på forskellige input.
Ved at bruge rand() funktionen i kombination med modulus operatoren kan vi begrænse den tilfældige tal til et bestemt interval. I eksemplet ovenfor er tallet begrænset til intervallet 0-99, ved at tage resten efter division med 100. Det er vigtigt at seede rand() funktionen med srand() og give den et unikt seed value (i eksemplet ovenfor er seedet current time) for at undgå at få samme tilfældige tal hver gang programmet køres.

Vi har også set på debugging værktøjer som breakpoints, stepping through code, og print statements for at hjælpe med at finde fejl i koden.
Vi har set på testing teknikker som unit testing, integration testing, og system testing for at sikre at programmet fungerer som forventet.
Alt i alt, har vi i denne lektion set på væsentlige emner som datatyper og test, som er vigtige for at skrive korrekt og robust kode i C-programmering.

### **Lektion 9: Tegn og Tekststrenge (28.10.2022)**

I denne lektion har vi set på datatypen char og tekststrenge i C-programmering.

Vi har diskuteret væsentlige funktioner fra string.h standard library, som giver mulighed for at arbejde med tekststrenge i C. Dette inkluderer funktioner til at kopiere, sammenligne, og manipulere tekststrenge, såsom strcpy, strcmp, og strcat.

```c
char destination[20];
char source[] = "Hello, World!";
strcpy(destination, source);
```

Vi har også set på eksempler på programmer, der behandler tekst, som kan omfatte at læse tekst fra en fil, manipulere tekststrenge for at ændre deres format eller indhold, og udskrive tekst til en skærm eller en fil.

Vi har set på konceptet omkring tekststrenges null-terminerings karakter, som indikerer enden af en tekststreng. 

Det er vigtigt at have dette i mente når man arbejder med tekststrenge i C, da det kan føre til fejl i programmet hvis det ikke håndteres korrekt. For eksempel, hvis man allokerer for lidt lager til en tekststreng, kan det føre til buffer overflow fejl, hvis den overskrider det allokerede lager.

Vi har også set på andre funktioner fra string.h biblioteket, såsom strlen, strcat, strstr, som giver mulighed for at finde længden af en tekststreng, kombinere to tekststrenge og finde en understreng i en tekststreng, og mange andre. Disse funktioner gør det nemmere at arbejde med tekststrenge i C og kan spare tid og kode.

Vi har også set på eksempler på programmer, der behandler tekst, som kan omfatte at læse tekst fra en fil, manipulere tekststrenge for at ændre deres format eller indhold, og udskrive tekst til en skærm eller en fil. Dette kan omfatte at læse en fil linje for linje, at søge efter specifikke ord i en tekstfil, eller at ændre formatteringen af tekst i en fil.

Alt i alt, har vi i denne lektion set på væsentlige emner som datatypen char og tekststrenge i C-programmering, samt de funktioner og metoder, der er tilgængelige for at arbejde med tekst i C. Det er vigtigt at have en grundig forståelse af disse emner for at skrive effektiv og robust kode, der kan håndtere tekst data.

### **Lektion 10: Datastrukturer - Structs (2.11.2022)**

I denne lektion har vi set på datastrukturer, specifikt structs, i C-programmering.

Vi har set på hvordan structs kan bruges til at gemme og organisere data i C ved at definere en datatype, der består af flere felter, hver med deres egen datatype.

```c
struct Person {
    char name[20];
    int age;
    char address[100];
};
```

Vi har også set på varianter af structs, såsom unions og structs med bitfelter. Unions giver mulighed for at gemme forskellige datatyper i samme variabel, mens structs med bitfelter giver mulighed for at spare lager ved at gemme data i mindre bit-felter.

Vi har set på arrays af structs og structs med arrays, som giver mulighed for at gemme flere instanser af en struct eller en array i en struct. Dette kan være nyttigt for at organisere og håndtere data i store eller komplekse programmer.

Vi har også kort nævnt forholdet mellem structs og classes i objekt-orienterede programmeringssprog. Structs er en form for simpel datastruktur, mens classes er en avanceret datastruktur med funktioner og metoder, der kan arbejde på dataene.

Alt i alt, har vi i denne lektion set på væsentlige emner som datastrukturer og structs i C-programmering, samt varianterne af structs og deres anvendelser i at organisere og håndtere data i C. Det er vigtigt at have en grundig forståelse af disse emner for at skrive effektiv og organiseret kode i C.

### **Lektion 11: Rekursion (4.11.2022)**

I denne lektion har vi set på rekursive procedurer og funktioner i C-programmering.

Rekursion er en metode, hvor en funktion kalder sig selv, indtil et bestemt stop-vilkår er opfyldt. Dette kan være en effektiv metode til at løse problemer, der kan deles op i mindre dele af samme type. For eksempel kan en rekursiv funktion til at beregne factorial af et tal n defineres som:

```c
int factorial(int n) {
    if (n == 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
```

Vi har også set på rekursive del og hersk algoritmer, som er en metode til at løse problemer ved at opdele dem i mindre dele og løse dem individuelt. En kendt eksempel på en rekursiv del og hersk algoritme er quicksort.

Vi har set på eksempler på meget hurtige og meget langsomme rekursive algoritmer, og hvordan valget af rekursion kan påvirke ydeevnen af programmet. Det er vigtigt at vælge den rigtige rekursive metode og at afslutte rekursionen korrekt for at undgå at programmet går i en evig loop og utilstrækkelig hukommelse.

Alt i alt, har vi i denne lektion set på væsentlige emner som rekursive procedurer og funktioner i C-programmering, samt metoder til at løse problemer ved hjælp af rekursion og deres påvirkning på ydeevnen af programmet. Det er vigtigt at have en grundig forståelse af rekursion og dens brug for at skrive effektiv og organiseret kode i C.

### **Lektion 12: Input/output og Filer (9.11.2022)**

I denne lektion har vi set på filbegreber. Vi lærte om forskellen mellem tekstfiler og binære filer, og hvordan de håndteres forskelligt. Vi lærte også om sekventielle filer og random access filer og hvordan de kan bruges til forskellige formål.

Vi gennemgik også hvordan filer håndteres i C-programmering, herunder brugen af funktionerne fopen, fclose, fread og fwrite for at åbne, lukke, læse fra og skrive til filer.

Vi øvede også mere på input og output ved hjælp af funktionerne scanf og printf. Eksempelvis kan vi bruge scanf til at indtaste data fra brugeren og gemme det i en variabel, fx:

```c
int alder;
printf("Indtast din alder: ");
scanf("%d", &alder);
```

Og vi kan bruge printf til at udskrive data til skærmen, fx:

```c
printf("Din alder er: %d", alder);
```

Vi lærte også om formatering af output ved hjælp af placeholders i printf-funktionen, fx:

```c
printf("Din alder er: %d år", alder);
```

Alt i alt, var det en informativ lektion hvor vi fordybede os i filbegreber, input/output og C-programmering.

### **Lektion 13: Dynamiske datastrukturer - lister og træer (11.11.2022)**

I denne lektion, den 11. november 2022, har vi set på dynamiske datastrukturer, som er datastrukturer, der kan ændre størrelse og form under kørslen. Vi har fokuseret på lister og træer, som er to af de mest almindelige dynamiske datastrukturer.

Vi startede med at se på kædede lister, som er en simpel form for datastruktur, der består af en række elementer, hvor hvert element har en reference til det næste element i listen. Hvert element i en kæde liste er kendt som en node, og kan indeholde en værdi og en reference til det næste element.

For eksempel kan vi bruge en kæde liste til at implementere en stak, hvor det nyeste element tilføjes til toppen og det ældste element fjernes fra toppen.

```c
struct Node {
    int data;
    Node* next;
};
```

Her er et eksempel på en node i en kæde liste.

Vi så også på varianter af kædede lister, såsom dobbeltekædede lister og cirkulære lister. En dobbeltekædet liste har referencer til både det næste og det forrige element i listen, mens en cirkulær liste har en reference til det første element i listen som sidste element.

Derefter gik vi videre til at se på binære træer, som er en mere avanceret form for datastruktur. Et binært træ består af elementer kendt som noder, hvor hver node kan have op til to under-elementer. Det kan bruges til at implementere en række forskellige algoritmer og datastrukturer. Et eksempel er binære søgetræer, hvor hvert element er sorteret i en bestemt orden, så det kan bruges til hurtigt at søge efter et bestemt element.

```c
struct Node {
    int key;
    Node *left, *right;
};
```

Her er et eksempel på en node i et binært træ.

Vi lærte også om traversering af træer, såsom pre-order, in-order, og post-order traversering. Pre-order traversering besøger først roden, derefter venstre side og til sidst højre side. In-order traversering besøger venstre side først, derefter roden og til sidst højre side. Post-order traversering besøger først venstre side, derefter højre side og til sidst roden. Det er især nyttigt når man skal slette et element i et binært træ, da det sikrer at elementet først slettes efter at dets under-elementer er blevet slettet.

Vi har også set på hvordan pointere kan bruges til at implementere dynamiske datastrukturer. Pointere er variabler, der indeholder en reference til en anden variabel, og kan bruges til at ændre størrelsen og formen af en datastruktur under kørslen. Pointere er især nyttige i kombination med dynamiske datastrukturer som lister og træer, da de giver mulighed for at ændre størrelsen og formen af datastrukturen under kørslen.

Eksempel på brug af pointer i kædede lister:

```c
Node* head = NULL;
head = (Node*)malloc(sizeof(Node));
```

Her er et eksempel på hvordan pointere kan bruges til at oprette en ny node i en kæde liste og allokere plads i hukommelsen til denne node.

Alt i alt var det en detaljeret og informativ lektion, hvor vi dykkede dybt ned i dynamiske datastrukturer og hvordan de kan bruges til at implementere avancerede algoritmer og datastrukturer i programmering. Vi så på kædede lister, varianter af kædede lister, binære træer og binære søgetræer, og hvordan pointere kan bruges i forbindelse med disse datastrukturer.
