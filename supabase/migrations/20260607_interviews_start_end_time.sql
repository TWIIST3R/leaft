-- Ajoute l'heure de début/fin aux entretiens, afin d'afficher l'horaire d'un
-- créneau validé directement dans la colonne "date" (et non plus dans les notes).
alter table public.interviews
  add column if not exists start_time time without time zone,
  add column if not exists end_time time without time zone;
