
-- 1. Add tier (class) to brands with coefficient
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'economy';
-- tier values: economy(1.0), comfort(1.3), business(1.7), premium(2.2), luxury(3.0)

-- Populate tiers for existing brands
UPDATE public.brands SET tier = 'economy' WHERE name IN (
  'Lada','УАЗ','ГАЗ','Москвич','Daewoo','ZAZ','Chery','Geely','Haval','FAW','Great Wall',
  'Lifan','JAC','BYD','Dongfeng','Changan','GAC','Zotye','Brilliance','Ravon','Datsun'
);
UPDATE public.brands SET tier = 'comfort' WHERE name IN (
  'Toyota','Nissan','Honda','Mazda','Mitsubishi','Subaru','Suzuki','Daihatsu','Isuzu',
  'Hyundai','Kia','SsangYong','Ford','Chevrolet','Opel','Fiat','Skoda','Seat','Renault',
  'Peugeot','Citroen','Dacia','Volkswagen'
);
UPDATE public.brands SET tier = 'business' WHERE name IN (
  'Audi','BMW','Mercedes-Benz','Volvo','Jaguar','Land Rover','Range Rover','Alfa Romeo',
  'Mini','Chrysler','Jeep','Dodge','Cadillac','Buick','Lincoln','Acura','Infiniti','Lexus','Genesis'
);
UPDATE public.brands SET tier = 'premium' WHERE name IN (
  'Porsche','Maserati','Bentley','Aston Martin','Tesla','Lotus'
);
UPDATE public.brands SET tier = 'luxury' WHERE name IN (
  'Ferrari','Lamborghini','Rolls-Royce','McLaren','Bugatti','Pagani','Koenigsegg'
);

-- 2. Remap old categories to the 9 canonical Hyperauto categories
UPDATE public.services SET category = 'Жидкости и фильтры' WHERE category IN ('Техническое обслуживание');
UPDATE public.services SET category = 'Двигатель и навесное оборудование' WHERE category IN ('Двигатель','Сцепление и КПП');
UPDATE public.services SET category = 'Ходовая часть и рулевое управление' WHERE category IN ('Подвеска','Рулевое управление');
UPDATE public.services SET category = 'Регулировочные работы' WHERE category IN ('Развал-схождение','Диагностика');
UPDATE public.services SET category = 'Электрика и электроника' WHERE category IN ('Электрика','Прочее','Кузовной ремонт');
UPDATE public.services SET category = 'Кондиционер и отопление' WHERE category = 'Кондиционер';
UPDATE public.services SET category = 'Тормозная система' WHERE category = 'Тормозная система';
UPDATE public.services SET category = 'Шиномонтажные работы' WHERE category = 'Шиномонтаж';

-- 3. Add topical services if missing
INSERT INTO public.services (name, category, base_price, duration_minutes) VALUES
  ('Замена топливного фильтра', 'Топливная система', 1500, 45),
  ('Промывка топливной системы', 'Топливная система', 3500, 90),
  ('Замена топливного насоса', 'Топливная система', 4500, 120),
  ('Чистка форсунок', 'Топливная система', 4000, 120),
  ('Диагностика топливной системы', 'Топливная система', 1200, 45)
ON CONFLICT DO NOTHING;
