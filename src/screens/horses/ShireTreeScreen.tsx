import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
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

  const { data } = await supabase
    .from('shezhire_horses')
    .select('*')
    .eq('id', id)
    .single();

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
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buildTree(horseId, 0).then(t => { setTree(t); setLoading(false); });
  }, [horseId]);

  if (loading) return <ActivityIndicator size="large" color="#e8b84b" style={{ flex: 1, backgroundColor: '#0f0f1a' }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} horizontal={false}>
      <ScrollView horizontal contentContainerStyle={{ minWidth: Dimensions.get('window').width }}>
        <View style={styles.treeWrap}>
          {tree && <TreeNodeView node={tree} navigation={navigation} />}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

function TreeNodeView({ node, navigation }: { node: TreeNode; navigation: any }) {
  if (!node.horse) {
    return (
      <View style={styles.emptyNode}>
        <Text style={styles.emptyText}>?</Text>
      </View>
    );
  }

  const horse = node.horse;

  return (
    <View style={styles.nodeContainer}>
      {(node.sire || node.dam) && (
        <View style={styles.parentsRow}>
          <View style={styles.parentCol}>
            {node.sire ? <TreeNodeView node={node.sire} navigation={navigation} /> : <EmptyNode />}
          </View>
          <View style={styles.parentCol}>
            {node.dam ? <TreeNodeView node={node.dam} navigation={navigation} /> : <EmptyNode />}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.node, horse.sex === 'м' ? styles.nodeMale : styles.nodeFemale]}
        onPress={() => navigation.navigate('HorseDetail', { horseId: horse.id })}
      >
        <Text style={styles.nodeBrand}>{horse.brand}</Text>
        {horse.name && <Text style={styles.nodeName}>{horse.name}</Text>}
        <Text style={styles.nodeYear}>{horse.birth_year}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyNode() {
  return (
    <View style={styles.emptyNode}>
      <Text style={styles.emptyText}>—</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  treeWrap: { alignItems: 'center', paddingBottom: 40 },
  nodeContainer: { alignItems: 'center' },
  parentsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  parentCol: { alignItems: 'center' },
  node: { borderRadius: 10, padding: 12, minWidth: 100, alignItems: 'center', marginTop: 4, borderWidth: 2 },
  nodeMale: { backgroundColor: '#0f1e2e', borderColor: '#4a8fc4' },
  nodeFemale: { backgroundColor: '#2e0f1e', borderColor: '#c44a8f' },
  nodeBrand: { color: '#e8b84b', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  nodeName: { color: '#fff', fontSize: 12, marginTop: 2 },
  nodeYear: { color: '#888', fontSize: 11, marginTop: 1 },
  emptyNode: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, minWidth: 100, alignItems: 'center', borderWidth: 1, borderColor: '#333', marginTop: 4 },
  emptyText: { color: '#444', fontSize: 18 },
});
