import type { VR360SceneListItem } from '../services/cafeApi';

export const VR360_NULL_TARGET_VALUE = '__vr360_null__';

export const getVr360SceneByTargetId = (
  scenes: VR360SceneListItem[],
  targetId: string | null | undefined,
) => {
  const normalizedTargetId = targetId?.trim();
  if (!normalizedTargetId) {
    return undefined;
  }

  return scenes.find((scene) => scene.target_id === normalizedTargetId);
};

export const isVr360NullTargetValue = (value: string | null | undefined) =>
  (value ?? '') === VR360_NULL_TARGET_VALUE;

export const getVr360TargetSelectValue = (targetId: string | null | undefined) =>
  targetId?.trim() || VR360_NULL_TARGET_VALUE;

export const buildVr360TargetOptions = (
  scenes: VR360SceneListItem[],
  selectedTargetId?: string | null,
) => {
  const activeScenes = scenes
    .filter((scene) => scene.is_active)
    .sort((left, right) => left.display_order - right.display_order || left.target_id.localeCompare(right.target_id));

  const selectedScene = getVr360SceneByTargetId(activeScenes, selectedTargetId ?? '');

  if (selectedScene || selectedTargetId == null) {
    return activeScenes;
  }

  const fallbackScene = getVr360SceneByTargetId(scenes, selectedTargetId);
  return fallbackScene ? [...activeScenes, fallbackScene] : activeScenes;
};

export const getVr360TargetLabel = (
  scenes: VR360SceneListItem[],
  targetId: string,
) => {
  const scene = getVr360SceneByTargetId(scenes, targetId);
  if (!scene) {
    return `ID ${targetId}`;
  }

  return scene.scene_name ? `${scene.target_id} - ${scene.scene_name}` : scene.target_id;
};
