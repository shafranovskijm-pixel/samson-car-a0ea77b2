CREATE UNIQUE INDEX IF NOT EXISTS car_custom_services_vehicle_service_unique_idx
ON public.car_custom_services (brand_name, model_name, year, category, name);