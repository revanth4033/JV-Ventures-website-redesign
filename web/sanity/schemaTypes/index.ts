import type {SchemaTypeDefinition} from 'sanity'

// Reusable inline rich text + image
import {richInline} from './objects/richInline'
import {imageWithAlt} from './objects/imageWithAlt'

// Animated title
import {titleLine} from './objects/titleLine'
import {animatedTitle} from './objects/animatedTitle'

// Shared small objects
import {link} from './objects/link'
import {navDropItem} from './objects/navDropItem'
import {navItem} from './objects/navItem'
import {cta} from './objects/cta'
import {stat} from './objects/stat'
import {homeStat} from './objects/homeStat'
import {quoteLine} from './objects/quoteLine'

// Home objects
import {soiTile} from './objects/soiTile'
import {bgSlice} from './objects/bgSlice'
import {strip} from './objects/strip'
import {deckSlide} from './objects/deckSlide'

// About objects
import {beliefRow} from './objects/beliefRow'
import {methodCard} from './objects/methodCard'
import {modelRow} from './objects/modelRow'
import {ecoTile} from './objects/ecoTile'
import {gridsLayer} from './objects/gridsLayer'

// Platform objects
import {metric} from './objects/metric'
import {venture} from './objects/venture'
import {category} from './objects/category'
import {total} from './objects/total'

// Team + Contact objects
import {office} from './objects/office'
import {teamMember} from './objects/teamMember'
import {teamGroup} from './objects/teamGroup'

// Documents
import {siteSettings} from './documents/siteSettings'
import {homePage} from './documents/homePage'
import {aboutPage} from './documents/aboutPage'
import {teamPage} from './documents/teamPage'
import {contactPage} from './documents/contactPage'
import {platform} from './documents/platform'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Documents
  siteSettings,
  homePage,
  aboutPage,
  teamPage,
  contactPage,
  platform,

  // Reusable rich text + image
  richInline,
  imageWithAlt,

  // Animated title
  titleLine,
  animatedTitle,

  // Shared small objects
  link,
  navDropItem,
  navItem,
  cta,
  stat,
  homeStat,
  quoteLine,

  // Home
  soiTile,
  bgSlice,
  strip,
  deckSlide,

  // About
  beliefRow,
  methodCard,
  modelRow,
  ecoTile,
  gridsLayer,

  // Platform
  metric,
  venture,
  category,
  total,

  // Team + Contact
  office,
  teamMember,
  teamGroup,
]
