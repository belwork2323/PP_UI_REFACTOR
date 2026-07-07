import { useCallback, useEffect, useMemo, useState } from "react";
import { createPostCureData, isPostCureInhibitionOperation } from "./postCureConfig";
import type { PostCureFormState } from "../../../data/models/user/PostCureFormModel";

type PostCureData = ReturnType<typeof createPostCureData>;

export const usePostCureFormHook = (
  initialData?: Partial<PostCureData> | PostCureFormState,
  onBlocksChange?: (payload: PostCureFormState) => void,
) => {
  const defaults = useMemo(() => createPostCureData(), []);

  const [operation, setOperationState] = useState("");
  const [inhibitorType, setInhibitorTypeState] = useState("");

  useEffect(() => {
    setOperationState("");
    setInhibitorTypeState("");
  }, [initialData, defaults]);

  const data = useMemo(
    () => ({
      schemaFormLoaded: initialData?.schemaFormLoaded ?? false,
      motors: initialData?.motors ?? [],
    }),
    [initialData],
  );

  const notify = useCallback(
    (nextData: PostCureData) => {
      onBlocksChange?.(nextData as PostCureFormState);
    },
    [onBlocksChange],
  );

  const setOperation = useCallback(
    (value: string) => {
      setOperationState(value);
      notify({
        ...data,
        schemaFormLoaded: false,
        motors: [],
      });
    },
    [data, notify],
  );

  const setInhibitorType = useCallback(
    (value: string) => {
      setInhibitorTypeState(value);
      notify({
        ...data,
        schemaFormLoaded: false,
        motors: [],
      });
    },
    [data, notify],
  );

  const showInhibitionFields = isPostCureInhibitionOperation(operation);

  return {
    operation,
    setOperation,
    inhibitorType,
    setInhibitorType,
    showInhibitionFields,
  };
};

export default usePostCureFormHook;
