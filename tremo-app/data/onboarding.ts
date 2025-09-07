import {AnimationObject} from 'lottie-react-native';

export interface OnboardingData {
  id: string;
  animation: AnimationObject;
  text: string;
  textColor: string;
  backgroundColor: string;
}

const data: OnboardingData[] = [
  {
    id: '1',
    animation: require('../assets/animations/Lottie1.json'),
    text: 'Welcome to Tremo! Your companion for managing hand tremors. 👋🏼 Our wearable wristband helps you regain control and confidence in daily tasks.',
    textColor: '#005b4f',
    backgroundColor: '#ffa3ce',
  },
  {
    id: '2',
    animation: require('../assets//animations/Lottie2.json'),
    text: 'Tremo detects tremors in real-time using smart sensors and counteracts shaking with gentle vibrations. Track your progress and adjust settings easily through the app.',
    textColor: '#1e2169',
    backgroundColor: '#bae4fd',
  },
  {
    id: '3',
    animation: require('../assets//animations/Lottie3.json'),
    text: 'Customize your tremor suppression levels, monitor your sessions, and see your progress over time. Tremo adapts to your needs for maximum comfort and effectiveness.',
    textColor: '#F15937',
    backgroundColor: '#faeb8a',
  },
];

export default data;