
REVOKE EXECUTE ON FUNCTION public.add_owner_as_group_member() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_email_preferences() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_trial() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_welcome_email_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_article_feedback_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_deck_card_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_group_member_count() FROM PUBLIC, anon, authenticated;
