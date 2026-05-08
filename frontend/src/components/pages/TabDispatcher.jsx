import { useParams } from 'react-router-dom';
import { AD_CATEGORIES } from '../../features/ads/config';
import AdBoardPage from '../../features/ads/AdBoardPage';
import DynamicTabPage from './DynamicTabPage';

export default function TabDispatcher() {
  const { tabId } = useParams();

  if (tabId && AD_CATEGORIES[tabId]) {
    return <AdBoardPage />;
  }

  return <DynamicTabPage />;
}
