import { library } from '@fortawesome/fontawesome-svg-core'
import { 
  faCreditCard, 
  faWallet, 
  faMobileAlt 
} from '@fortawesome/free-solid-svg-icons'
import { 
  faCcVisa, 
  faCcMastercard 
} from '@fortawesome/free-brands-svg-icons'

// Add icons to library
library.add(
  faCcVisa,
  faCcMastercard,
  faMobileAlt,
  faWallet,
  faCreditCard
)