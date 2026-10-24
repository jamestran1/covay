# Cờ Vây

A web app that teaches beginners to play Go and lets them practise playing games.

## Language

### Playing

**Board**:
A square grid of Points, 5 to 19 lines per side, each Point empty or holding a Black or White stone.
_Avoid_: Goban, grid

**Point**:
One intersection of the Board, addressed by zero-based (x, y) from the top-left corner.
_Avoid_: Vertex, intersection, coordinate

**Position**:
An immutable snapshot of a Board together with the colour to move.
_Avoid_: State, board state

**Move**:
Either a Play of a stone on a Point or a Pass. Resigning is not a Move.
_Avoid_: Turn, action

**Illegal move**:
A Play rejected by the rules because its Point is occupied, it would be suicide, or it would break Positional superko. Suicide is always illegal.
_Avoid_: Invalid move, error

**Game**:
One match between Black and White, from the first Move to its Game result, passing through the phases Playing, Scoring and Finished.
_Avoid_: Match, round

**Scoring**:
The phase after two consecutive Passes in which the players agree on Dead stones; disagreement sends the Game back to Playing.
_Avoid_: Counting, end game

**Resign**:
A player conceding the Game, ending it immediately without Scoring.
_Avoid_: Surrender, forfeit

**Komi**:
Points added to White's score to offset Black's first-move advantage; 7.5 by default, 0.5 in handicap Games.
_Avoid_: Compensation

**Handicap**:
2 to 9 Black stones placed on fixed star Points before White's first Move, with White compensated one point per handicap stone.
_Avoid_: Free placement

**Area scoring**:
The scoring method this app uses: a player's score is their stones on the board plus the empty points they surround, plus komi for White (Chinese rules).
_Avoid_: Chinese counting, territory scoring (that is the Japanese method, not used)

**Positional superko**:
The rule forbidding any move that recreates a whole-board position that has already occurred in the Game.
_Avoid_: Ko rule (too narrow), triple ko

**Dead stones**:
Whole chains still on the Board during Scoring that the players agree are captured; they are removed before counting.
_Avoid_: Dead groups, prisoners

**Captures**:
The number of stones each player has taken off the Board during play; shown to the learner but not used in Area scoring.
_Avoid_: Prisoners, prisoner count

**Undo**:
Taking back the most recent Move (or the last pair when playing the AI) during Playing.
_Avoid_: Takeback, rewind

**Game result**:
How a Finished Game ended: a win by Resignation, a win by a score margin, or Jigo.
_Avoid_: Result (on its own), outcome, winner

**Jigo**:
A drawn Game, possible only when Komi is a whole number.
_Avoid_: Draw, tie

### Learning

**Lesson**:
A guided, interactive sequence of steps that teaches one rule or concept.
_Avoid_: Tutorial, course

**Tsumego**:
A life-and-death problem: a fixed position where the learner must find the correct sequence of moves.
_Avoid_: Puzzle, problem, exercise

**Goal**:
What the learner must achieve in a Tsumego: Live, Kill or Capture.
_Avoid_: Objective, task

**Solution tree**:
The authored tree of a Tsumego's Moves, alternating learner and opponent, whose leaves are marked Correct or Wrong. Any Move outside the tree is wrong.
_Avoid_: Answer, solution, variations

**Refutation**:
The opponent's reply sequence on a Wrong branch of a Solution tree, played to show the learner why their Move fails.
_Avoid_: Punishment, counter

**Attempt**:
One try at a Tsumego, from its starting Position until it is Solved or Failed. Illegal moves do not end an Attempt.
_Avoid_: Try, session, run
