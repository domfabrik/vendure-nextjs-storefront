import EmailIcon from '@mui/icons-material/Email';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PhoneIcon from '@mui/icons-material/Phone';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Box, Link, List, ListItem, ListItemText, Typography } from '@mui/material';
import { contacts } from '@routes';
import { Metadata } from 'next';
import { envServer } from '@/shared/config/index.server';

export const metadata: Metadata = {
  title: 'О компании',
  description: 'О компании DomFabrik — интернет-магазин мебели. Работаем по всей России, находимся в Туле.',
  alternates: { canonical: `${envServer.SITE_URL}/about` },
};

const sectionHeadingSx = { fontWeight: 600, mt: 4, mb: 1 } as const;
const bulletListSx = { listStyleType: 'disc', pl: 4, '& .MuiListItem-root': { display: 'list-item', py: 0.5 } } as const;

export default function AboutPage() {
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
        О компании
      </Typography>

      <Typography sx={{ mb: 2 }}>
        «Дом Фабрик» — это мебель под любой запрос. Мы работаем по всей России, а находимся в Туле. Отправляем заказы в любой регион: транспортными компаниями или собственной
        доставкой по городу и области.
      </Typography>

      <Typography sx={{ mb: 2 }}>Мы на рынке уже более 5 лет — за это время более тысячи семей доверили свой интерьер и комфорт нам.</Typography>

      {/* Миссия */}
      <Typography
        variant="h5"
        sx={sectionHeadingSx}
      >
        Наша миссия
      </Typography>

      <Typography sx={{ mb: 2 }}>
        Сделать качественную мебель доступной для каждого. Мы хотим, чтобы вы обустраивали дом с удовольствием, не переплачивая и не тратя время на бесконечный поиск.
      </Typography>

      {/* Почему выбирают */}
      <Typography
        variant="h5"
        sx={sectionHeadingSx}
      >
        Почему нас выбирают
      </Typography>

      <List
        component="ul"
        sx={bulletListSx}
      >
        <ListItem>
          <ListItemText primary="Честные низкие цены — работаем напрямую с производителями без лишних наценок" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Мебель на любой бюджет: от недорогих и практичных вариантов до мебели из массива дерева" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Сотрудничаем с российскими фабриками и зарубежными производителями" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Изготовление на заказ: меняем размеры, материалы, цвета" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Прозрачная оплата: предоплата 10%, остаток — перед получением" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Аккуратная доставка: перед отправкой всё проверяем и упаковываем" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Гарантия 24 месяца на товары" />
        </ListItem>
      </List>

      {/* Салон */}
      <Typography
        variant="h5"
        sx={sectionHeadingSx}
      >
        Наш салон
      </Typography>

      <Typography sx={{ mb: 2 }}>
        На сайте вы можете сравнивать, выбирать и заказывать товары. А если хотите посмотреть образцы вживую — приезжайте в наш салон в Туле. Наши менеджеры всегда помогут
        подобрать то, что нужно.
      </Typography>

      {/* Контакты */}
      <Typography
        variant="h5"
        sx={sectionHeadingSx}
      >
        Свяжитесь с нами
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StorefrontIcon color="primary" />
          <Typography>{contacts.address}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PhoneIcon color="primary" />
          <Typography>
            <Link
              href={contacts.phoneHref}
              underline="hover"
            >
              {contacts.phone}
            </Link>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EmailIcon color="primary" />
          <Typography>
            <Link
              href={contacts.emailHref}
              underline="hover"
            >
              {contacts.email}
            </Link>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalShippingIcon color="primary" />
          <Typography>Доставка по всей России</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VerifiedIcon color="primary" />
          <Typography>Гарантия 24 месяца</Typography>
        </Box>
      </Box>
    </Box>
  );
}
