import { Ionicons } from "@expo/vector-icons";

export const icon = {
    home: (props: any) => <Ionicons name='power-outline' size={24} {...props} />,
    manual: (props: any) => <Ionicons name='options-outline' size={24} {...props} />,
    reports: (props: any) => <Ionicons name='bar-chart-outline' size={24} {...props} />,
    profile: (props: any) => <Ionicons name='person-outline' size={24} {...props} />
}