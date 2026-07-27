
CREATE POLICY "catalog-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalog-images');

CREATE POLICY "catalog-images auth insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'catalog-images');

CREATE POLICY "catalog-images auth update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'catalog-images')
  WITH CHECK (bucket_id = 'catalog-images');

CREATE POLICY "catalog-images auth delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'catalog-images');
