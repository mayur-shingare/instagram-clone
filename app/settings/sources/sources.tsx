import { useMutation, useQuery } from '@apollo/client';
import LoggedInLayout from '@components/LoggedInLayout';
import Toaster, { ToastType } from '@components/Toaster';
import { TOAST_MESSAGES } from '@constants/index';
import { CREATE_INCOMING_SOURCE, UPDATE_SOURCE_STATUS } from '@graphql/mutations';
import { GET_SOURCES } from '@graphql/queries';
import { useLoggedInUser } from '@hooks/useLoggedInUser';
import { IncomingSource } from '@models/types';
import { Waveform } from '@uiball/loaders';
import { ChangeEvent, createContext, useEffect } from 'react';
import SettingsLayout from '../settings.layout';
import AddSource from './AddSource';
export const CallContext = createContext({});

export default function SettingsSources() {
  const loggedInUser = useLoggedInUser();
  const {
    data: sourcesData,
    loading: sourcesDataLoading,
    refetch: sourcesDataRefetch,
  } = useQuery(GET_SOURCES, {
    context: {
      headers: {
        'custom-cache': 'ignore',
      },
    },
    variables: {
      sortOrder: {
        createdOn: 'desc',
      },
    },
  });

  const [updateSourcesStatusMutation, { error: updateSourcesStatusMutationError }] = useMutation(UPDATE_SOURCE_STATUS);
  const [createIncomingSourceMutation, { error: createIncomingSourceMutationError }] =
    useMutation(CREATE_INCOMING_SOURCE);

  useEffect(() => {
    if (createIncomingSourceMutationError)
      Toaster({ type: ToastType.ERROR, message: TOAST_MESSAGES.incomingSources.error });
  }, [createIncomingSourceMutationError]);

  const updateSourceStatus = async (status: string, id: number) => {
    await updateSourcesStatusMutation({
      variables: {
        id: id,
        data: { isActive: { set: status === 'Active' ? 1 : 0 } },
      },
    });
    if (updateSourcesStatusMutationError) {
      Toaster({ type: ToastType.ERROR, message: TOAST_MESSAGES.incomingSources.error });
    }
    await sourcesDataRefetch();
  };

  const onAddIncomingSourceSubmit = async (values: { name: string }) => {
    await createIncomingSourceMutation({
      variables: {
        data: {
          name: values.name,
        },
      },
    });
    await sourcesDataRefetch();
  };

  return (
    <>
      <LoggedInLayout user={loggedInUser}>
        <SettingsLayout>
          <AddSource onAddIncomingSourceSubmit={onAddIncomingSourceSubmit} />
          <div className="rounded-lg shadow-sm ring-1 ring-black ring-opacity-5">
            {sourcesDataLoading ? (
              <div className="flex h-16 items-center justify-center rounded-lg  border-4 border-dashed border-gray-200">
                <Waveform size={20} lineWeight={2.5} speed={1} color="grey" />
              </div>
            ) : (
              <ul role="list" className="divide-y divide-gray-200">
                {sourcesData?.incomingSources?.map((source: IncomingSource) => (
                  <li key={source.id} className="py-5 px-5">
                    <div className="flex items-center space-x-3">
                      <div className="h-full flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">{source.name}</h3>
                          <p className="text-sm text-gray-500">
                            <select
                              id={`select-${source.id}`}
                              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                              defaultValue={source.isActive === 1 ? 'Active' : 'Inactive'}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                updateSourceStatus(e.target.value, source.id);
                              }}>
                              <option defaultValue={'null'}>-- select an option --</option>
                              <option key={'Active'} value={'Active'}>
                                {'Active'}
                              </option>
                              <option key={'Inactive'} value={'Inactive'}>
                                {'Inactive'}
                              </option>
                            </select>
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}

                {sourcesData?.incomingSources?.length === 0 && (
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
