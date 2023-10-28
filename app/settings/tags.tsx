import { useMutation, useQuery } from '@apollo/client';
import LoggedInLayout from '@components/LoggedInLayout';
import Toaster, { ToastType } from '@components/Toaster';
import { TOAST_MESSAGES } from '@constants/index';
import { UPDATE_TAG_STATUS } from '@graphql/mutations';
import { GET_TAGS } from '@graphql/queries';
import { useLoggedInUser } from '@hooks/useLoggedInUser';
import { Tag } from '@models/types';
import { Waveform } from '@uiball/loaders';
import { ChangeEvent, createContext, useEffect } from 'react';
import SettingsLayout from './settings.layout';
export const CallContext = createContext({});

export default function SettingsTag() {
  const loggedInUser = useLoggedInUser();
  {
    /* all the queries */
  }
  const {
    data: tagsData,
    loading,
    refetch,
  } = useQuery(GET_TAGS, {
    context: {
      headers: {
        'custom-cache': 'ignore',
      },
    },
    variables: {
      sortOrder: 'asc',
    },
  });
  {
    /* queries end here */
  }

  {
    /* all the mutations */
  }
  const [updateTagsStatusMutation, { error: updateTagsStatusMutationError }] = useMutation(UPDATE_TAG_STATUS);
  {
    /* mutations end here */
  }

  useEffect(() => {
    if (updateTagsStatusMutationError) Toaster({ type: ToastType.ERROR, message: TOAST_MESSAGES.tags.error });
  }, [updateTagsStatusMutationError]);

  const updateTagStatus = async (status: string, id: number) => {
    await updateTagsStatusMutation({
      variables: {
        id: id,
        data: { isActive: { set: status === 'Active' ? 1 : 0 } },
      },
    });
    await refetch();
  };

  return (
    <>
      <LoggedInLayout user={loggedInUser}>
        <SettingsLayout>
          <div className="rounded-lg shadow-sm ring-1 ring-black ring-opacity-5">
            {loading ? (
              <div className="">
                <div className="flex h-16 items-center justify-center rounded-lg  border-4 border-dashed border-gray-200">
                  <Waveform size={20} lineWeight={2.5} speed={1} color="grey" />
                </div>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-gray-200">
                {tagsData?.tags?.map((tag: Tag) => (
                  <li key={tag.id} className="py-5 px-5">
                    <div className="flex items-center space-x-3">
                      <div className="h-full flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">{tag.name}</h3>
                          <p className="text-sm text-gray-500">
                            <select
                              id={`select-${tag.id}`}
                              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                              defaultValue={tag.isActive === 1 ? 'Active' : 'InActive'}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                updateTagStatus(e.target.value, tag.id);
                              }}>
                              <option defaultValue={'null'}> -- select an option -- </option>
                              <option key={'Active'} value={'Active'}>
                                {'Active'}
                              </option>
                              <option key={'InActive'} value={'InActive'}>
                                {'InActive'}
                              </option>
                            </select>
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}

                {tagsData?.tags?.length === 0 && (
                  <div className="flex h-16 items-center justify-center">
                    <p className="text-base text-gray-500">No Records Found</p>
                  </div>
                )}
              </ul>
            )}
          </div>
        </SettingsLayout>
      </LoggedInLayout>
    </>
  );
}
