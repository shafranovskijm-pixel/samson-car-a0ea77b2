
-- ============ SCHEMA ============
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.service_prices (
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  PRIMARY KEY (service_id, brand_id)
);

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  year INTEGER,
  license_plate TEXT,
  vin TEXT,
  color TEXT,
  engine_volume NUMERIC(3,1),
  engine_power INTEGER,
  transmission TEXT,
  drive_type TEXT,
  mileage INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  mechanic_id UUID REFERENCES public.mechanics(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled',
  mileage INTEGER,
  comment TEXT,
  total_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.appointment_services (
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  PRIMARY KEY (appointment_id, service_id)
);

CREATE INDEX idx_cars_client ON public.cars(client_id);
CREATE INDEX idx_appointments_starts_at ON public.appointments(starts_at);
CREATE INDEX idx_appointments_mechanic ON public.appointments(mechanic_id);

-- ============ GRANTS + RLS (no auth: allow anon full access — internal tool) ============
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['brands','services','service_prices','clients','cars','mechanics','appointments','appointment_services'])
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Public full access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ============ SEED: BRANDS ============
INSERT INTO public.brands (name) VALUES
('Lada'),('УАЗ'),('ГАЗ'),('Москвич'),('Toyota'),('Lexus'),('Nissan'),('Infiniti'),('Honda'),('Acura'),
('Mazda'),('Mitsubishi'),('Subaru'),('Suzuki'),('Daihatsu'),('Isuzu'),('Hyundai'),('Kia'),('Genesis'),('SsangYong'),
('Daewoo'),('Chery'),('Haval'),('Geely'),('Great Wall'),('Changan'),('Exeed'),('Omoda'),('Jaecoo'),('Tank'),
('JAC'),('GAC'),('BYD'),('Zeekr'),('Li Auto'),('Voyah'),('Hongqi'),('BMW'),('Mercedes-Benz'),('Audi'),
('Volkswagen'),('Skoda'),('Porsche'),('Opel'),('Mini'),('Smart'),('Ford'),('Chevrolet'),('Cadillac'),('Dodge'),
('Chrysler'),('Jeep'),('Tesla'),('Renault'),('Peugeot'),('Citroen'),('DS'),('Fiat'),('Alfa Romeo'),('Volvo'),
('Land Rover'),('Jaguar'),('Datsun'),('Iveco'),('Man');

-- ============ SEED: SERVICES ============
INSERT INTO public.services (category, name, base_price, duration_minutes) VALUES
-- Диагностика
('Диагностика','Компьютерная диагностика двигателя',2000,60),
('Диагностика','Диагностика ходовой части',1500,45),
('Диагностика','Диагностика тормозной системы',1200,30),
('Диагностика','Диагностика электрооборудования',2500,60),
('Диагностика','Диагностика АКПП',3000,60),
('Диагностика','Диагностика кондиционера',1500,30),
-- ТО
('Техническое обслуживание','ТО-1 (базовое)',5000,120),
('Техническое обслуживание','ТО-2 (расширенное)',9000,180),
('Техническое обслуживание','Замена масла ДВС + фильтр',1500,45),
('Техническое обслуживание','Замена масла МКПП',1200,45),
('Техническое обслуживание','Замена масла АКПП (частичная)',3500,90),
('Техническое обслуживание','Замена масла АКПП (полная)',6500,150),
('Техническое обслуживание','Замена масла в раздатке/редукторе',1500,45),
('Техническое обслуживание','Замена воздушного фильтра',500,15),
('Техническое обслуживание','Замена салонного фильтра',600,20),
('Техническое обслуживание','Замена топливного фильтра',1500,45),
('Техническое обслуживание','Замена свечей зажигания',1200,30),
('Техническое обслуживание','Замена свечей накала',1800,45),
-- Тормозная система
('Тормозная система','Замена тормозных колодок (перед)',1500,45),
('Тормозная система','Замена тормозных колодок (зад)',1500,45),
('Тормозная система','Замена тормозных дисков (перед)',2500,90),
('Тормозная система','Замена тормозных дисков (зад)',2500,90),
('Тормозная система','Замена тормозной жидкости',1800,60),
('Тормозная система','Прокачка тормозов',1200,45),
('Тормозная система','Ремонт суппорта',2500,90),
-- Подвеска
('Подвеска','Замена амортизаторов (пара)',2500,90),
('Подвеска','Замена стоек стабилизатора',1500,45),
('Подвеска','Замена сайлентблоков рычага',2500,90),
('Подвеска','Замена рычага подвески',3000,90),
('Подвеска','Замена шаровой опоры',1800,60),
('Подвеска','Замена ступичного подшипника',3500,120),
('Подвеска','Замена пружины подвески',2500,90),
('Подвеска','Замена пыльника ШРУСа',2000,90),
('Подвеска','Замена ШРУСа',3500,120),
-- Рулевое
('Рулевое управление','Замена рулевой рейки',8000,240),
('Рулевое управление','Ремонт рулевой рейки',6000,240),
('Рулевое управление','Замена рулевых наконечников',1800,60),
('Рулевое управление','Замена рулевых тяг',2200,60),
('Рулевое управление','Замена жидкости ГУР',1500,45),
-- Двигатель
('Двигатель','Замена ремня ГРМ',6500,240),
('Двигатель','Замена цепи ГРМ',12000,360),
('Двигатель','Замена ремня генератора',1500,45),
('Двигатель','Замена помпы',4500,180),
('Двигатель','Замена термостата',2500,90),
('Двигатель','Замена антифриза + промывка',2000,60),
('Двигатель','Замена прокладки клапанной крышки',3500,150),
('Двигатель','Замена сальников коленвала',5500,240),
('Двигатель','Ремонт двигателя (капитальный)',80000,3000),
-- Сцепление / КПП
('Сцепление и КПП','Замена сцепления',12000,360),
('Сцепление и КПП','Замена выжимного подшипника',4500,180),
('Сцепление и КПП','Ремонт МКПП',15000,600),
-- Электрика
('Электрика','Замена аккумулятора',500,15),
('Электрика','Замена стартера',3500,120),
('Электрика','Замена генератора',3500,120),
('Электрика','Ремонт проводки',2500,90),
('Электрика','Замена лампы фары',400,15),
-- Кондиционер
('Кондиционер','Заправка кондиционера',2500,45),
('Кондиционер','Дозаправка кондиционера',1500,30),
('Кондиционер','Чистка испарителя кондиционера',3000,90),
('Кондиционер','Замена компрессора кондиционера',6500,180),
-- Шиномонтаж
('Шиномонтаж','Шиномонтаж (R13-R15)',1600,45),
('Шиномонтаж','Шиномонтаж (R16-R18)',2000,45),
('Шиномонтаж','Шиномонтаж (R19+)',2800,60),
('Шиномонтаж','Балансировка колеса',400,15),
('Шиномонтаж','Ремонт прокола (жгут)',400,20),
('Шиномонтаж','Ремонт прокола (грибок)',800,30),
-- Развал-схождение
('Развал-схождение','Развал-схождение (легковой)',2500,90),
('Развал-схождение','Развал-схождение (внедорожник)',3500,120),
-- Кузов
('Кузовной ремонт','Полировка кузова',6000,240),
('Кузовной ремонт','Локальная покраска элемента',6500,480),
('Кузовной ремонт','Удаление вмятины без покраски',3500,120),
-- Прочее
('Прочее','Вскрытие автомобиля',2500,30),
('Прочее','Эвакуация в сервис (город)',3500,60);

-- ============ TRIGGER: recompute appointments.total_price ============
CREATE OR REPLACE FUNCTION public.recompute_appointment_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.appointment_id;
  ELSE
    target_id := NEW.appointment_id;
  END IF;
  UPDATE public.appointments
  SET total_price = COALESCE((SELECT SUM(price) FROM public.appointment_services WHERE appointment_id = target_id), 0)
  WHERE id = target_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_appt_services_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.appointment_services
FOR EACH ROW EXECUTE FUNCTION public.recompute_appointment_total();
