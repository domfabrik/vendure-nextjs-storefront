import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import { Box, Link, Typography } from '@mui/material';
import { contacts } from '@routes';
import { Metadata } from 'next';
import { envServer } from '@/shared/config/index.server';

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Контактная информация интернет-магазина DomFabrik — телефон, адрес, карта проезда',
  alternates: { canonical: `${envServer.SITE_URL}/contacts` },
};
const YANDEX_MAP_SRC = 'https://yandex.ru/map-widget/v1/?ol=biz&oid=114768615150';

export default function ContactsPage() {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 4,
        borderRadius: 2,
        my: 4,
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, textAlign: 'center', mb: 4 }}
      >
        Контакты
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: { xs: 400, md: 450 },
            borderRadius: 2,
            overflow: 'hidden',
            order: { xs: 2, md: 1 },
            position: 'relative',
          }}
        >
          <iframe
            src={YANDEX_MAP_SRC}
            style={{ border: 0, position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            allowFullScreen
            loading="lazy"
            title="Карта салона «Эра» на улице Галкина 2 в Туле"
          />
        </Box>

        <Box sx={{ order: { xs: 1, md: 2 }, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOnIcon color="primary" />
            <Typography
              variant="body1"
              sx={{ minWidth: 0 }}
            >
              {contacts.address}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PhoneIcon color="primary" />
            <Typography variant="body1">
              <Link
                href={contacts.phoneHref}
                underline="hover"
              >
                {contacts.phone}
              </Link>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon color="primary" />
            <Typography variant="body1">
              <Link
                href={contacts.emailHref}
                underline="hover"
              >
                {contacts.email}
              </Link>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3, pl: 4 }}>
            <Link
              href={contacts.yandexMapsHref}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              Яндекс Карты
            </Link>
            <Link
              href={contacts.twoGisHref}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              2ГИС
            </Link>
            <Link
              href={contacts.twoGisRouteHref}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              Построить маршрут в 2ГИС
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
