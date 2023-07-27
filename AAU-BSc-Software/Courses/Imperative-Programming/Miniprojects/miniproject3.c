#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_TEAMS 12
#define MAX_MATCHES 132

typedef struct {
    char team1[5];
    char team2[5];
    int score1;
    int score2;
} Match;

typedef struct {
    char name[5];
    int points;
    int goals;
    int goals_against;
} Team;

int compare_teams(const void *team1, const void *team2) {
    const Team *t1 = (Team *)team1;
    const Team *t2 = (Team *)team2;
    if (t1->points != t2->points) {
        return t2->points - t1->points;
    }
    int diff1 = t1->goals - t1->goals_against;
    int diff2 = t2->goals - t2->goals_against;
    if (diff1 != diff2) {
        return diff2 - diff1;
    }
    return strcmp(t1->name, t2->name);
}

int main() {
    char filename[] = "kampe-2020-2021.txt";
    FILE *file = fopen(filename, "r");
    if (file == NULL) {
        printf("Failed to open input file\n");
        return 1;
    }

    Match matches[MAX_MATCHES];
    int num_matches = 0;

    while (fscanf(file, "%*s %*d/%*d %*d.%*d %s - %s %d - %d %*d",
                  matches[num_matches].team1, matches[num_matches].team2,
                  &matches[num_matches].score1, &matches[num_matches].score2) == 4) {
        num_matches++;
    }
    fclose(file);

    Team teams[MAX_TEAMS];
    int num_teams = 0;
    for (int i = 0; i < num_matches; i++) {
        int index1 = -1;
        for (int j = 0; j < num_teams; j++) {
            if (strcmp(teams[j].name, matches[i].team1) == 0) {
                index1 = j;
                break;
            }
        }

        if (index1 == -1) {
            strcpy(teams[num_teams].name, matches[i].team1);
            teams[num_teams].points = 0;
            teams[num_teams].goals = 0;
            teams[num_teams].goals_against = 0;
            index1 = num_teams;
            num_teams++;
        }

        int index2 = -1;
        for (int j = 0; j < num_teams; j++) {
            if (strcmp(teams[j].name, matches[i].team2) == 0) {
                index2 = j;
                break;
            }
        }

        if (index2 == -1) {
            strcpy(teams[num_teams].name, matches[i].team2);
            teams[num_teams].points = 0;
            teams[num_teams].goals = 0;
            teams[num_teams].goals_against = 0;
            index2 = num_teams;
            num_teams++;
        }

        if (matches[i].score1 > matches[i].score2) {

            teams[index1].points += 3;
        } else if (matches[i].score1 == matches[i].score2) {
            teams[index1].points += 1;
            teams[index2].points += 1;
        } else {
            teams[index2].points += 3;
        }
        teams[index1].goals += matches[i].score1;
        teams[index1].goals_against += matches[i].score2;
        teams[index2].goals += matches[i].score2;
        teams[index2].goals_against += matches[i].score1;
    }

    qsort(teams, num_teams, sizeof(Team), compare_teams);

    printf("Team-name|Points|Goals-by-team|Goals-against-team\n");
    for (int i = 0; i < num_teams; i++) {
        printf("%-5s %7d %10d %13d\n", teams[i].name, teams[i].points,
               teams[i].goals, teams[i].goals_against);
    }

    return 0;
}