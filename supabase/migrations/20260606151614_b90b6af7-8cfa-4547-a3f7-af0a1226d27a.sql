DO $$
DECLARE
  rec RECORD;
  new_deck_id uuid;
  inserted_count int;
BEGIN
  FOR rec IN
    SELECT mf.user_id, mf.material_id, sm.title, sm.subject
    FROM (
      SELECT DISTINCT user_id, material_id FROM public.material_flashcards
    ) mf
    JOIN public.study_materials sm ON sm.id = mf.material_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.flashcard_decks d
      WHERE d.source_material_id = mf.material_id
        AND d.user_id = mf.user_id
    )
  LOOP
    INSERT INTO public.flashcard_decks (name, user_id, description, subject, source_material_id, card_count)
    VALUES (
      COALESCE(rec.title, 'Untitled'),
      rec.user_id,
      'Auto-generated from "' || COALESCE(rec.title, 'Untitled') || '"',
      rec.subject,
      rec.material_id,
      0
    )
    RETURNING id INTO new_deck_id;

    INSERT INTO public.flashcards (deck_id, front, back, hint)
    SELECT new_deck_id, front, back, hint
    FROM public.material_flashcards
    WHERE material_id = rec.material_id AND user_id = rec.user_id;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;

    UPDATE public.flashcard_decks
      SET card_count = inserted_count
      WHERE id = new_deck_id;
  END LOOP;
END $$;