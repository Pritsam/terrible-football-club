create policy "Players can resubmit their own rejected submissions"
  on public.stat_submissions for update
  to authenticated
  using (player_id = auth.uid() and status = 'rejected')
  with check (player_id = auth.uid() and submitted_by = auth.uid() and status = 'pending');
