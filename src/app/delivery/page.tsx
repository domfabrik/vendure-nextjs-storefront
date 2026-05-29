import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhoneIcon from '@mui/icons-material/Phone';
import { Box, Link, List, ListItem, ListItemText, Typography } from '@mui/material';
import { contacts } from '@routes';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Доставка',
  description: 'Информация о доставке мебели по Туле, Тульской области и всей России — интернет-магазин DomFabrik',
};

const sectionHeadingSx = { fontWeight: 600, mt: 4, mb: 1 } as const;
const bulletListSx = { listStyleType: 'disc', pl: 4, '& .MuiListItem-root': { display: 'list-item', py: 0.5 } } as const;

export default function DeliveryPage() {
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
        sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}
      >
        Доставка
      </Typography>

      <Typography sx={{ mb: 2 }}>
        Вы можете получить заказ практически в любой точке России. Мы организуем доставку транспортными компаниями или собственной службой доставки по Туле и Тульской области.
      </Typography>

      {/* Доставка по Туле */}
      <Typography
        variant="h5"
        sx={sectionHeadingSx}
      >
        Доставка по Туле и Тульской области
      </Typography>

      <Typography sx={{ mb: 2 }}>Для покупателей из Тулы и Тульской области действуют следующие условия:</Typography>

      <List
        component="ul"
        sx={bulletListSx}
      >
        <ListItem>
          <ListItemText primary="Доставка по городу — 2 500 ₽ (водитель без грузчиков)" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Доставка за город — 2 500 ₽ + 50 ₽ за каждый километр пути (дорога считается в оба конца)" />
        </ListItem>
      </List>

      <Typography sx={{ mb: 2, mt: 1 }}>Занос с грузчиками, а также вопросы по подъёму на этаж уточняйте у менеджера индивидуально.</Typography>

      {/* Доставка по России */}
      <Typography
        variant="h5"
        sx={sectionHeadingSx}
      >
        Доставка по России
      </Typography>

      <Typography sx={{ mb: 2 }}>Доставка в другие регионы осуществляется одной из транспортно-логистических компаний:</Typography>

      <List
        component="ul"
        sx={bulletListSx}
      >
        <ListItem>
          <ListItemText primary="СДЭК" />
        </ListItem>
        <ListItem>
          <ListItemText primary="ПЭК" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Деловые Линии" />
        </ListItem>
      </List>

      <Typography sx={{ mb: 2, mt: 1 }}>Товар может быть доставлен прямо к вам в квартиру или вы можете забрать его на оперативном складе перевозчика в вашем городе.</Typography>

      {/* Стоимость */}
      <Typography
        variant="h5"
        sx={sectionHeadingSx}
      >
        Стоимость доставки
      </Typography>

      <Typography sx={{ mb: 2 }}>Стоимость доставки зависит от удалённости и габаритов заказа. Рекомендуем связаться с менеджером для точного расчёта стоимости.</Typography>

      {/* Гарантия сохранности */}
      <Typography
        variant="h5"
        sx={sectionHeadingSx}
      >
        Гарантия сохранности
      </Typography>

      <Typography sx={{ mb: 2 }}>
        Перед отправкой каждый заказ тщательно проверяется и упаковывается. Мы заботимся о том, чтобы мебель приехала к вам в идеальном состоянии.
      </Typography>

      {/* Контакт */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          bgcolor: 'background.default',
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShippingIcon color="primary" />
          <Typography sx={{ fontWeight: 600 }}>Есть вопросы по доставке?</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon
            color="primary"
            fontSize="small"
          />
          <Typography>
            Позвоните нам:{' '}
            <Link
              href={contacts.phoneHref}
              underline="hover"
              sx={{ fontWeight: 600 }}
            >
              {contacts.phone}
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
