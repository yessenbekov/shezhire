import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import type { Colors } from '../../theme';
import type { Horse } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HerdsStackParamList } from '../../navigation';

type Props = {
  navigation: NativeStackNavigationProp<HerdsStackParamList, 'ShireTree'>;
  route: RouteProp<HerdsStackParamList, 'ShireTree'>;
};

interface TreeNode {
  horse: Horse | null;
  sire: TreeNode | null;
  dam: TreeNode | null;
  depth: number;
}

async function buildTree(id: string | null, depth: number, maxDepth = 4): Promise<TreeNode> {
  if (!id || depth >= maxDepth) return { horse: null, sire: null, dam: null, depth };
  const { data } = await supabase.from('shezhire_horses').select('*').eq('id', id).single();
  if (!data) return { horse: null, sire: null, dam: null, depth };
  const horse = data as Horse;
  const [sire, dam] = await Promise.all([
    buildTree(horse.sire_id, depth + 1, maxDepth),
    buildTree(horse.dam_id, depth + 1, maxDepth),
  ]);
  return { horse, sire, dam, depth };
}

export default function ShireTreeScreen({ navigation, route }: Props) {
  const { horseId } = route.params;
  const { C } = useTheme();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buildTree(horseId, 0).then(t => { setTree(t); setLoading(false); });
  }, [horseId]);

  if (loading) return <ActivityIndicator size="large" color={C.gold} style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <ScrollView horizontal contentContainerStyle={{ minWidth: Dimensions.get('window').width }}>
        <View style={{ alignItems: 'center', paddingBottom: 40 }}>
          {tree && <TreeNodeView node={tree} navigation={navigation} C={C} />}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

function TreeNodeView({ node, navigation, C }: { node: TreeNode; navigation: any; C: Colors }) {
  const styles = treeStyles(C);
  if (!node.horse) {
    return (
      <View style={styles.emptyNode}>
        <Text style={styles.emptyText}>?</Text>
      </View>
    );
  }

  const horse = node.horse;
  const isMale = horse.sex === 'м';

  return (
    <View style={{ alignItems: 'center' }}>
      {(node.sire || node.dam) && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          <View style={{ alignItems: 'center' }}>
            {node.sire ? <TreeNodeView node={node.sire} navigation={navigation} C={C} /> : <EmptyTreeNode C={C} />}
          </View>
          <View style={{ alignItems: 'center' }}>
            {node.dam ? <TreeNodeView node={node.dam} navigation={navigation} C={C} /> : <EmptyTreeNode C={C} />}
          </View>
        </View>
      )}
      <TouchableOpacity
        style={[styles.node, { backgroundColor: isMale ? C.maleBg : C.femaleBg, borderColor: isMale ? C.maleBorder : C.femaleBorder }]}
        onPress={() => navigation.navigate('HorseDetail', { horseId: horse.id })}
      >
        <Text style={[styles.nodeBrand, { color: C.gold }]}>{horse.brand}</Text>
        {horse.name && <Text style={[styles.nodeName, { color: C.text }]}>{horse.name}</Text>}
        <Text style={[styles.nodeYear, { color: C.muted }]}>{horse.birth_year}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyTreeNode({ C }: { C: Colors }) {
  const styles = treeStyles(C);
  return (
    <View style={styles.emptyNode}>
      <Text style={styles.emptyText}>—</Text>
    </View>
  );
}

const treeStyles = (C: Colors) => StyleSheet.create({
  node: { borderRadius: 10, padding: 12, minWidth: 100, alignItems: 'center', marginTop: 4, borderWidth: 2 },
  nodeBrand: { fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  nodeName: { fontSize: 12, marginTop: 2 },
  nodeYear: { fontSize: 11, marginTop: 1 },
  emptyNode: { backgroundColor: C.surface, borderRadius: 10, padding: 12, minWidth: 100, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginTop: 4 },
  emptyText: { color: C.faint, fontSize: 18 },
});
