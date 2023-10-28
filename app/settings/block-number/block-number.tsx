import { useLazyQuery, useMutation } from '@apollo/client';
import BlockedNumberModal from '@components/BlockedNumberModal/BlockedNumberModal';
import Button from '@components/Button';
import LoggedInLayout from '@components/LoggedInLayout';
import Toaster, { ToastType } from '@components/Toaster';
import { PRISMA_ERROR_CODE_UNIQUE_CLAUSE, TOAST_MESSAGES } from '@constants/index';
import { CREATE_EXCLUDED_PHONE_NUMBER, REMOVE_EXCLUDED_PHONE_NUMBER } from '@graphql/mutations';
import { GET_EXCLUDED_PHONE_NUMBERS, GET_TRANSCRIPTION_BY_FROM_NUMBER } from '@graphql/queries';
import { useLoggedInUser } from '@hooks/useLoggedInUser';
import { ExcludedPhoneNumber } from '@models/types';
import { Waveform } from '@uiball/loaders';
import axios from 'axios';
import { createContext, useCallback, useEffect, useState } from 'react';
import SettingsLayout from '../settings.layout';
import AddNumber from './AddNumber';
export const CallContext = createContext({});

export default function SettingsexcludedNumber() {
  const loggedInUser = useLoggedInUser();
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [transcriptionDownloading, setTranscriptionDownloading] = useState<boolean>(false);
  const [transcriptionModalContent, setTranscriptionModalContent] = useState<string>('');
  const [reasonForBlocking, setReasonForBlocking] = useState<string>('');
  const [onlyAIFilterEnabled, setOnlyAIFilterEnabled] = useState(false);

  const [excludedNumberDataFetch, { data: excludedNumberData, loading: excludedNumberDataLoading }] = useLazyQuery(
    GET_EXCLUDED_PHONE_NUMBERS,
    {
      fetchPolicy: 'network-only',
      context: {
        headers: {
          'custom-cache': 'ignore',
        },
      },
      variables: {
        sortOrder: {
          createdOn: 'desc',
        },
        where: {},
      },
    }
  );

  const [fetchRecordingTranscriptionByFromNumber] = useLazyQuery(GET_TRANSCRIPTION_BY_FROM_NUMBER, {
    context: {
      headers: {
        'custom-cache': 'ignore',
      },
    },
    variables: {},
  });

  const [
    createExcludedPhoneNumberMutation,
    { error: createExcludedPhoneNumberError, data: addExcludedPhoneNumberData },
  ] = useMutation(CREATE_EXCLUDED_PHONE_NUMBER);

  const [
    removeExcludedPhoneNumberMutation,
    { error: removeExcludedPhoneNumberError, data: removeExcludedPhoneNumberData },
  ] = useMutation(REMOVE_EXCLUDED_PHONE_NUMBER);

  useEffect(() => {
    excludedNumberDataFetch();
  }, []);

  useEffect(() => {
    if (createExcludedPhoneNumberError) {
      if (
        JSON.parse(createExcludedPhoneNumberError?.graphQLErrors?.[0]?.message ?? '{}')?.code ===
        PRISMA_ERROR_CODE_UNIQUE_CLAUSE
      ) {
        Toaster({ type: ToastType.ERROR, message: TOAST_MESSAGES.excludedPhoneNumber.unique });
      } else {
        Toaster({ type: ToastType.ERROR, message: TOAST_MESSAGES.excludedPhoneNumber.error });
      }
    }
  }, [createExcludedPhoneNumberError]);

  useEffect(() => {
    if (removeExcludedPhoneNumberError) {
      Toaster({ type: ToastType.ERROR, message: TOAST_MESSAGES.excludedPhoneNumber.error });
    }
  }, [removeExcludedPhoneNumberError]);

  useEffect(() => {
    if (removeExcludedPhoneNumberData) {
      Toaster({ type: ToastType.SUCCESS, message: TOAST_MESSAGES.excludedPhoneNumber.numberRemoveSuccess });
    }
  }, [removeExcludedPhoneNumberData]);

  useEffect(() => {
    if (addExcludedPhoneNumberData) {
      Toaster({ type: ToastType.SUCCESS, message: TOAST_MESSAGES.excludedPhoneNumber.numberAddSuccess });
    }
  }, [addExcludedPhoneNumberData]);

  const onAddExcludedNumberSubmit = useCallback(
    async (values: { phoneNumber: string }) => {
      await createExcludedPhoneNumberMutation({
        variables: {
          data: {
            phoneNumber: values.phoneNumber,
            blockedBy: loggedInUser?.username,
          },
        },
      });
      setOnlyAIFilterEnabled(false);
      await excludedNumberDataFetch();
    },
    [createExcludedPhoneNumberMutation, excludedNumberDataFetch, loggedInUser]
  );

  const onRemoveExcludedNumber = useCallback(
    async (values: { phoneNumber: string }) => {
      await removeExcludedPhoneNumberMutation({
        variables: {
          data: {
            phoneNumber: values.phoneNumber,
          },
        },
      });
      await excludedNumberDataFetch();
    },
    [excludedNumberDataFetch, removeExcludedPhoneNumberMutation]
  );

  const downloadTranscribe = useCallback(async (fromPhoneNumber: string) => {
    if (fromPhoneNumber) {
      try {
        const response = await fetchRecordingTranscriptionByFromNumber({
          variables: { call_from: fromPhoneNumber },
        });

        if (response?.data?.recordingTranscriptions?.[0]?.transcription_job_name) {
          Toaster({ type: ToastType.SUCCESS, message: TOAST_MESSAGES.excludedPhoneNumber.downloadingTranscribe });
          setTranscriptionDownloading(true);
          setTranscriptionModalContent('');
          setReasonForBlocking('');
          const { data }: any = await axios('/api/getTranscribe', {
            method: 'POST',
            data: {
              job_name: `${response?.data?.recordingTranscriptions?.[0]?.transcription_job_name}`,
            },
          });
          if (data.srt) {
            setTranscriptionModalContent(data.srt);
            setShowTranscriptionModal(true);
            setReasonForBlocking(
              response?.data?.recordingTranscriptions?.[0]?.CallRecording?.CallLog?.callStatusPredicted?.[0]?.reason ??
                ''
            );
          } else {
            Toaster({ type: ToastType.ERROR, message: TOAST_MESSAGES.excludedPhoneNumber.emptyTranscribe });
            setReasonForBlocking('');
            setTranscriptionModalContent('');
          }
          setTranscriptionDownloading(false);
        }
      } catch (err) {
        setTranscriptionDownloading(false);
        setReasonForBlocking('');
        setTranscriptionModalContent('');
        Toaster({ type: ToastType.ERROR, message: TOAST_MESSAGES.excludedPhoneNumber.downloadingTranscribeError });
      }
    }
  }, []);

  return (
    <>
      <LoggedInLayout user={loggedInUser}>
        <SettingsLayout>
          <AddNumber onAddExcludedNumberSubmit={onAddExcludedNumberSubmit} />
          <div className="ml-5 mb-2">
            <Button
              onClick={() => {
                setOnlyAIFilterEnabled(prevOnlyAIFilterEnabled => {
                  if (prevOnlyAIFilterEnabled) {
                    excludedNumberDataFetch({
                      variables: {
                        sortOrder: {
                          createdOn: 'desc',
                        },
                        where: {},
                      },
                    });
                  } else {
                    excludedNumberDataFetch({
                      variables: {
                        sortOrder: {
                          createdOn: 'desc',
                        },
                        where: { blockedBy: { equals: 'GPT-4' } },
                      },
                    });
                  }
                  return !prevOnlyAIFilterEnabled;
                });
              }}
              type={'submit'}
              primary
              className="mt-3 inline-flex items-center justify-center rounded-md">
              {onlyAIFilterEnabled ? 'Show All' : 'Show only blocked by AI'}
            </Button>
          </div>
          <div className="rounded-lg shadow-sm ring-1 ring-black ring-opacity-5">
            {excludedNumberDataLoading ? (
              <div className="flex h-16 items-center justify-center rounded-lg  border-4 border-dashed border-gray-200">
                <Waveform size={20} lineWeight={2.5} speed={1} color="grey" />
              </div>
            ) : (
              <ul role="list" className="divide-y divide-gray-200">
                {excludedNumberData?.findManyExcludedPhoneNumbers?.map((phoneNumber: ExcludedPhoneNumber) => (
                  <li key={phoneNumber.id} className="py-5 px-5">
                    <div className="flex items-center space-x-3">
                      <div className="h-full flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">{phoneNumber.phoneNumber}</h3>

                          <h3 className="text-sm">
                            Blocked by :{' '}
                            <span className="font-bold">
                              {phoneNumber?.blockedBy ? `${phoneNumber?.blockedBy}` : 'N/A'}
                            </span>
                            {phoneNumber?.blockedBy === 'GPT-4' && (
                              <button
                                onClick={async () => {
                                  await downloadTranscribe(phoneNumber.phoneNumber);
                                }}>
                                <span className="ml-2 font-light text-blue-500">(Info)</span>
                              </button>
                            )}
                          </h3>

                          <p className="text-sm text-red-500">
                            <button
                              onClick={() => {
                                onRemoveExcludedNumber({ phoneNumber: phoneNumber.phoneNumber });
                              }}>
                              Remove
                            </button>
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}

                {excludedNumberData?.findManyExcludedPhoneNumbers?.length === 0 && (
                  <div className="flex h-16 items-center justify-center">
                    <p className="text-base text-gray-500">No Records Found</p>
                  </div>
                )}
              </ul>
            )}

            <BlockedNumberModal
              reasonForBlocking={reasonForBlocking}
              open={showTranscriptionModal && !transcriptionDownloading}
              onClose={() => {
                setShowTranscriptionModal(false);
                setTranscriptionModalContent('');
                setReasonForBlocking('');
              }}
              transcriptionContent={transcriptionModalContent}
            />
          </div>
        </SettingsLayout>
      </LoggedInLayout>
    </>
  );
}
