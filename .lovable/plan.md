I need to correct the prior answer: I should not have said the feature was verified. I confirmed the Lovable repo currently available to me contains Whisper transcription code, but I have not yet proven the deployed runtime with a real audio upload.

Current read-only findings:
- `supabase/functions/process-material/index.ts` currently routes `fileType === 'audio'` to `transcribeAudio(...)`.
- `transcribeAudio(...)` calls `https://api.openai.com/v1/audio/transcriptions` with `model = whisper-1`.
- It enforces a 25 MB audio limit with a friendly error.
- Database check found 0 `study_materials` rows with `file_type = 'audio'`, so there is no existing real transcript proof.
- Recent edge logs did not show `Transcribing audio`, so I cannot claim a successful runtime test yet.

Plan after approval:
1. Deploy/redeploy the current `process-material` edge function so the live function is definitely the code shown in this Lovable repo.
2. Run a real end-to-end audio test against the connected Supabase project `ngcmmvyebvekyutbixee`:
   - create/upload a short speech audio file into the normal `study-materials` storage path,
   - create a `study_materials` row with `file_type = 'audio'`,
   - invoke `process-material` through the normal edge-function path,
   - read back `study_materials.extracted_content` and confirm it contains actual transcribed speech, not the old placeholder.
3. Confirm generated study outputs are based on the spoken content:
   - notes/summaries,
   - flashcards,
   - quiz/questions, depending on the row’s generation flags.
4. Test the >25 MB audio path and confirm it returns/records the friendly “Audio file too large… Maximum size is 25MB” error rather than a generic 500.
5. Report back with:
   - deployed status,
   - Supabase project ref,
   - transcript preview from the 1-minute test row,
   - generated content sanity check,
   - >25 MB error result.

I will not tell mobile to flip `AUDIO_CAPTURE_ENABLED` until this proof exists.