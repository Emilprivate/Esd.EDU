#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>

//Definitions
#define MAX_DECK  52                   //Max deck size without jokers
#define SYMBOLS   4                    //Amount of card symbols
#define SYMB_DECK (MAX_DECK / 4)       //Contains the amount of cards each symbol can have (52 / 4 = 13)
#define JOKERS    3                    //Amount of jokers
#define MAX_ARR   (MAX_DECK+JOKERS+1)  //Max array size
#define OFFSET    1                    //Offsetting some of the values in the code for better overview

//Typedefs of enumeration types
typedef enum e_card_symbol      {Clubs, Diamonds, Hearts, Spades, Joker}          card_symbol;
typedef enum e_card_privilege   {Regular, Jack, Queen, King, Ace, Speciel}        card_privilege;

//Typedefs of structs
typedef struct card_struct
{
    int             cardNumber;         // 2-10
    card_symbol     cardSymbol;         // enumeration type e_card_symbol
    card_privilege  cardPrivilege;      // enumeration type e_privileged_card

} card_t;

//Prototypes
void generate_deck(card_t[]);
void scramble_deck(card_t[]);
void sort_deck(card_t[]);
void print_deck(const char *, card_t[]);
const char* string_from_symbol(card_symbol);
const char* string_from_privilege(card_privilege);
enum e_card_symbol choose_card_symbol(int);
enum e_card_privilege choose_card_privilege(int);
int compare(const void *, const void*);

int main(void)
{
    card_t cards[MAX_ARR];
    srand(time(NULL));

    generate_deck(cards);
    print_deck("Generated deck", cards);

    scramble_deck(cards);
    print_deck("Scrambled deck", cards);

    sort_deck(cards);
    print_deck("Sorted deck", cards);

    return 0;
}

void generate_deck(card_t cards[])
{
    bool flag = false;

    for (int i = 2, j = 1, f = 1; f <= MAX_DECK && j <= SYMBOLS; i++, f++)
    {

        if (flag){
            j++;
            i=2;
            flag = false;
        }

        card_t new_card  = {i, choose_card_symbol(j), choose_card_privilege(i)};
        cards[f]         = new_card;

        if (i == SYMB_DECK+OFFSET)
            flag = true;


        if (j == SYMBOLS)
            for (int q = 1; q <= JOKERS; q++)
            {
                card_t joker = {69, Joker, Speciel};
                cards[f+q] = joker;
            }
    }
}

void scramble_deck(card_t cards[])
{
    for (int i = 0; i < MAX_ARR; i++)
    {
        int random_position = rand() % MAX_DECK+JOKERS;
        card_t temp_card    = cards[i];
        cards[i] = cards[random_position];
        cards[random_position] = temp_card;
    }
}

void sort_deck(card_t cards[])
{
    qsort(cards, MAX_ARR, sizeof(card_t), compare);
}

void print_deck(const char *description, card_t cards[])
{
    printf("++++++++++++++++++++++++++++%s++++++++++++++++++++++++++++\n", description);
    for (int i = 2, j = 1; i <= MAX_DECK+JOKERS+OFFSET && j <= SYMBOLS+OFFSET; i++){
        printf("[%d] card_number: %d | card_symbol: %s | card_privilege: %s\n",
               i-OFFSET,
               cards[i-OFFSET].cardNumber,
               string_from_symbol(cards[i-OFFSET].cardSymbol),
               string_from_privilege(cards[i-OFFSET].cardPrivilege));

        if (i-OFFSET == (SYMB_DECK)*j){
            j++;
            printf("------------------------------------------------------------------\n");
        }

        if (i-OFFSET == MAX_DECK+JOKERS)
            j++;
    }
}

const char* string_from_symbol(card_symbol cardSymbol)
{
    const char *strings[] = {"Clubs", "Diamonds", "Hearts", "Spades", "Joker"};
    return strings[cardSymbol];
}

const char* string_from_privilege(card_privilege cardPrivilege)
{
    const char *strings[] = {"Regular", "Jack", "Queen", "King", "Ace", "Speciel"};
    return strings[cardPrivilege];
}

enum e_card_symbol choose_card_symbol(int flag)
{
    switch(flag)
    {
        case 1:
            return Clubs;
        case 2:
            return Diamonds;
        case 3:
            return Hearts;
        case 4:
            return Spades;
        default:
            exit(EXIT_FAILURE);
    }
}

enum e_card_privilege choose_card_privilege(int flag)
{
    switch(flag)
    {
        case 14:
            return Ace;
        case 11:
            return Jack;
        case 12:
            return Queen;
        case 13:
            return King;
        default:
            return Regular;
    }
}

int compare (const void * a, const void * b) {
    card_t *j = (card_t*)a;
    card_t *l = (card_t*)b;

    if (j->cardSymbol == Clubs && l->cardSymbol != Clubs){
        return j->cardSymbol - l->cardSymbol;
    }else if (j->cardSymbol == Clubs && l->cardSymbol == Clubs){
        return j->cardNumber - l->cardNumber;
    }

    if (j->cardSymbol == Diamonds && l->cardSymbol != Diamonds){
        return j->cardSymbol - l->cardSymbol;
    }else if (j->cardSymbol == Diamonds && l->cardSymbol == Diamonds){
        return j->cardNumber - l->cardNumber;
    }

    if (j->cardSymbol == Hearts && l->cardSymbol != Hearts){
        return j->cardSymbol - l->cardSymbol;
    }else if (j->cardSymbol == Hearts && l->cardSymbol == Hearts){
        return j->cardNumber - l->cardNumber;
    }

    if (j->cardSymbol == Spades && l->cardSymbol != Spades){
        return j->cardSymbol - l->cardSymbol;
    }else if (j->cardSymbol == Spades && l->cardSymbol == Spades){
        return j->cardNumber - l->cardNumber;
    }

    return j->cardNumber - l->cardNumber;
}