import type { VR360SceneListItem } from '../services/cafeApi';

export const getVr360SceneByTargetId = (
  scenes: VR360SceneListItem[],
  targetId: string | number,
) => {
  const numericId = Number(targetId);
  if (!Number.isFinite(numericId)) {
    return undefined;
  }

  return scenes.find((scene) => scene.id === numericId);
};

export const buildVr360TargetOptions = (
  scenes: VR360SceneListItem[],
  selectedTargetId?: string | number,
) => {
  const activeScenes = scenes
    .filter((scene) => scene.is_active)
    .sort((left, right) => left.display_order - right.display_order || left.id - right.id);

  const selectedScene = getVr360SceneByTargetId(activeScenes, selectedTargetId ?? '');

  if (selectedScene || selectedTargetId == null) {
    return activeScenes;
  }

  const fallbackScene = getVr360SceneByTargetId(scenes, selectedTargetId);
  return fallbackScene ? [...activeScenes, fallbackScene] : activeScenes;
};

export const getVr360TargetLabel = (
  scenes: VR360SceneListItem[],
  targetId: string | number,
) => {
  const scene = getVr360SceneByTargetId(scenes, targetId);
  if (!scene) {
    return `ID ${targetId}`;
  }

  return scene.scene_name ? `ID ${scene.id} - ${scene.scene_name}` : `ID ${scene.id}`;
};
