import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { Button } from './Button';

interface HeaderProps {
  onScheduleCall?: () => void;
}

export function Header({ onScheduleCall }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>ditto</Text>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Health Insurance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Life Insurance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Claims</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Careers</Text>
        </TouchableOpacity>
      </View>
      {onScheduleCall && (
        <Button
          title="Schedule a Call"
          onPress={onScheduleCall}
          icon={Calendar}
          iconPosition="left"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flex: 1,
    marginLeft: 40,
  },
  navItem: {
    paddingVertical: 8,
  },
  navText: {
    fontSize: 15,
    color: '#3C3C43',
    fontWeight: '500',
  },
});
