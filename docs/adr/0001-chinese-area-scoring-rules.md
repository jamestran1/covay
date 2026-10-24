# Chinese rules: Area scoring, Positional superko, no suicide

Most Go teaching material uses Japanese territory scoring, but the app plays and scores by Chinese rules: Area scoring after removing agreed Dead stones (Tromp-Taylor style counting, seki stones count), Positional superko, and suicide always illegal. Area scoring can be computed exactly by the rules engine, disputes over Dead stones are settled by resuming play instead of special-case judgement, and KataGo (our AI) is trained and calibrated for it; results almost always match Japanese scoring within one point. Lessons still explain territory scoring so learners can read other material.

## Consequences

- Default Komi is 7.5; handicap Games give White one point per handicap stone and use Komi 0.5.
- The Game keeps its whole Position history so superko can be checked.
