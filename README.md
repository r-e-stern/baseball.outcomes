# baseball.outcomes
**baseball.outcomes** is a tool that uses current FiveThirtyEight MLB predictions to project the probability of teams' specific end-season outcomes like seeding and playoff 
opponents. Uses 2020 MLB playoff rules &amp; tiebreakers.

## How to use
Users can input a number of iterations to run, select a team's results to display, and hit go to simulate the seasons and view the results. Once the simulations have run, there
is no additional processing time and users can switch between teams by simply selecting a new team and hitting go.

## Sample output
![2020 Colorado Rockies outcome projections](https://i.imgur.com/Wj0jWRf.png)
These graphs were generated before play started on August 24, 2020.

## How it works
This tool was written using JavaScript, jQuery, [Chart.js](https://www.chartjs.org/), [csv-to-array](https://code.google.com/archive/p/csv-to-array/downloads), and of course 
the [FiveThirtyEight MLB predictions](https://github.com/fivethirtyeight/data/tree/master/mlb-elo). It dynamically generates a requested number of simulated (remainders of) 
2020 MLB seasons and displays teams' most likely win totals, playoff seeds and opponents, and draft picks.
