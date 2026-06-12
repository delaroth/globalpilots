Audit the affiliate link architecture.

1. Use the investigator subagent to find every place a partner URL
   (TravelPayouts/Aviasales, Kiwi, Agoda, Klook, GetYourGuide) is constructed
   or hardcoded — components, lib/, app/api/, data/.
2. From its report, list violations of the rule "affiliate URL construction
   lives in lib/, never in components."
3. Check that tracking parameters (marker/affiliate IDs) are consistent and
   come from env vars, not literals.
4. Output a short table: file → partner → issue → fix. Do not change any code
   unless I say so.

Extra focus, if provided: $ARGUMENTS
