import Button from '@components/Button';
import CustomInput from '@components/FormElements/CustomInput';
import { Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
export interface IAddSource {
  name: string;
}

const formValidationSchema = Yup.object({
  name: Yup.string().required('Enter name of incoming source'),
});

const AddSource = ({ onAddIncomingSourceSubmit }: { onAddIncomingSourceSubmit: (values: IAddSource) => any }) => {
  return (
    <div className="space-x-2 space-y-2 py-5 px-5">
      <Formik
        initialValues={{ name: '' }}
        validateOnBlur
        validationSchema={formValidationSchema}
        onSubmit={async (values: IAddSource, { setSubmitting, resetForm }: FormikHelpers<IAddSource>) => {
          setSubmitting(true);
          await onAddIncomingSourceSubmit(values);
          setSubmitting(false);
          resetForm();
        }}>
        {({ errors, touched, isSubmitting }) => (
          <Form className="flex justify-between align-middle">
            <div className="w-80">
              <CustomInput inputName="name" label="source name" error={errors.name} touched={touched.name} required />
            </div>
            <Button
              type={'submit'}
              primary
              disabled={isSubmitting}
              className="mt-3 inline-flex h-8 w-36  items-center justify-center rounded-md">
              Add
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddSource;
