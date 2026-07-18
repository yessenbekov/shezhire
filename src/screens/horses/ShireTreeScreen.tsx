import React, { useState, useEffect, useRef } from 'react';
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

// Batch-fetch all ancestors in at most maxDepth round trips (one per generation level)
// instead of one query per node (O(2^n) requests).
async function fetchAncestorMap(rootId: string, maxDepth = 4): Promise<Record<string, Horse>> {
  const map: Record<string, Horse> = {};
  let toFetch = [rootId];

  for (let depth = 0; depth < maxDepth && toFetch.length > 0; depth++) {
    const { data } = await supabase
      .from('shezhire_horses')
      .select('*')
      .in('id', toFetch);

    if (!data) break;

    const nextToFetch: string[] = [];
    for (const horse of data as Horse[]) {
      map[horse.id] = horse;
      if (horse.sire_id && !map[horse.sire_id]) nextToFetch.push(horse.sire_id);
      if (horse.dam_id && !map[horse.dam_id]) nextToFetch.push(horse.dam_id);
    }
    toFetch = [...new Set(nextToFetch)];
  }

  return map;
}

function buildTree(id: string | null, map: Record<string, Horse>, depth: number, maxDepth = 4): TreeNode {
  if (!id || depth >= maxDepth) return { horse: null, sire: null, dam: null, depth };
  const horse = map[id] ?? null;
  if (!horse) return { horse: null, sire: null, dam: null, depth };
  return {
    horse,
    sire: buildTree(horse.sire_id ?? null, map, depth + 1, maxDepth),
    dam:  buildTree(horse.dam_id  ?? null, map, depth + 1, maxDepth),
    depth,
  };
}

export default function ShireTreeScreen({ navigation, route }: Props) {
  const { horseId } = route.params;
  const { C } = useTheme();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchAncestorMap(horseId).then(map => {
      if (!mounted.current) return;
      setTree(buildTree(horseId, map, 0));
      setLoading(false);
    });
    return () => { mounted.current = false; };
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

function TreeNodeView({ node, navigation, C }: { node: TreeNode; navigation: NativeStackNavigationProp<HerdsStackParamList>; C: Colors }) {
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
