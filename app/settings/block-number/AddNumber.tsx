import Button from '@components/Button';
import CustomInput from '@components/FormElements/CustomInput';
import Toaster, { ToastType } from '@components/Toaster';
import { TOAST_MESSAGES } from '@constants/index';
import { IAddSource } from '@models/types';
import { Form, Formik, FormikHelpers } from 'formik';
import { parsePhoneNumber } from 'libphonenumber-js';
import * as Yup from 'yup';

const formValidationSchema = Yup.object({
  phoneNumber: Yup.string().required('Enter Phone Number'),
});

const AddNumber = ({ onAddExcludedNumberSubmit }: { onAddExcludedNumberSubmit: (values: IAddSource) => any }) => {
  return (
    <div className="space-x-2 space-y-2 py-5 px-5">
      <Formik
        initialValues={{ phoneNumber: '' }}
        validateOnBlur
        validationSchema={formValidationSchema}
        onSubmit={async (values: IAddSource, { setSubmitting, resetForm }: FormikHelpers<IAddSource>) => {
          setSubmitting(true);
          try {
            parsePhoneNumber(values?.phoneNumber);
            try {
              await onAddExcludedNumberSubmit(values);
            } catch (err) {}
            resetForm();
            setSubmitting(false);
          } catch (err) {
            setSubmitting(false);
            Toaster({ type: ToastType.ERROR, message: TOAST_MESSAGES.excludedPhoneNumber.invalidNumber });
          }
        }}>
        {({ errors, touched, isSubmitting }) => (
          <Form className="flex justify-between align-middle">
            <div className="w-80">
              <CustomInput
                inputName="phoneNumber"
                label="Phone Number"
                error={errors.phoneNumber}
                touched={touched.phoneNumber}
                required
              />
            </div>
            <Button
              disabled={isSubmitting}
              type={'submit'}
              primary
              className="mt-3 inline-flex h-8 w-36  items-center justify-center rounded-md">
              Add
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddNumber;
