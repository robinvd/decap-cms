import { Map } from 'immutable';

import { MediaLibrary } from '../MediaLibrary';

function createFile(name) {
  return new File(['file contents'], name, { type: 'image/jpeg' });
}

function createEvent(files) {
  return {
    persist: jest.fn(),
    stopPropagation: jest.fn(),
    preventDefault: jest.fn(),
    target: {
      files,
      value: 'selected',
    },
  };
}

function createMediaLibrary(overrides = {}) {
  const props = {
    files: [],
    config: Map(),
    field: Map({ name: 'pictures' }),
    value: [],
    allowMultiple: true,
    canInsert: true,
    privateUpload: false,
    persistMedia: jest.fn(file =>
      Promise.resolve({
        payload: {
          file: {
            path: `uploads/${file.name}`,
          },
        },
      }),
    ),
    insertMedia: jest.fn(),
    closeMediaLibrary: jest.fn(),
    loadMedia: jest.fn(),
    deleteMedia: jest.fn(),
    t: jest.fn(key => key),
    ...overrides,
  };
  const component = new MediaLibrary(props);
  component.setState = jest.fn();
  component.scrollToTop = jest.fn();
  return { component, props };
}

describe('MediaLibrary', () => {
  describe('handleAssetClick', () => {
    it('toggles multiple selected assets for multiple fields', () => {
      const { component } = createMediaLibrary();
      const firstAsset = { key: 'one', path: 'uploads/one.jpg' };
      const secondAsset = { key: 'two', path: 'uploads/two.jpg' };

      component.handleAssetClick(firstAsset);

      expect(component.setState).toHaveBeenCalledWith({
        selectedFile: firstAsset,
        selectedFiles: [firstAsset],
      });

      component.state.selectedFiles = [firstAsset, secondAsset];
      component.handleAssetClick(firstAsset);

      expect(component.setState).toHaveBeenLastCalledWith({
        selectedFile: secondAsset,
        selectedFiles: [secondAsset],
      });
    });

    it('keeps single selection for fields that do not allow multiple values', () => {
      const { component } = createMediaLibrary({ allowMultiple: false, value: '' });
      const asset = { key: 'one', path: 'uploads/one.jpg' };

      component.handleAssetClick(asset);

      expect(component.setState).toHaveBeenCalledWith({ selectedFile: asset, selectedFiles: [] });
    });
  });

  describe('handleInsert', () => {
    it('inserts all selected assets for multiple fields', () => {
      const { component, props } = createMediaLibrary();
      component.state.selectedFiles = [
        { key: 'one', path: 'uploads/one.jpg' },
        { key: 'two', path: 'uploads/two.jpg' },
      ];

      component.handleInsert();

      expect(props.insertMedia).toHaveBeenCalledWith(
        ['uploads/one.jpg', 'uploads/two.jpg'],
        props.field,
      );
      expect(props.closeMediaLibrary).toHaveBeenCalledTimes(1);
    });
  });

  describe('handlePersist', () => {
    it('persists and inserts all selected files for multiple fields', async () => {
      const { component, props } = createMediaLibrary();
      const firstFile = createFile('one.jpg');
      const secondFile = createFile('two.jpg');
      const event = createEvent([firstFile, secondFile]);

      await component.handlePersist(event);

      expect(props.persistMedia).toHaveBeenCalledTimes(2);
      expect(props.persistMedia).toHaveBeenNthCalledWith(1, firstFile, {
        privateUpload: false,
        field: props.field,
      });
      expect(props.persistMedia).toHaveBeenNthCalledWith(2, secondFile, {
        privateUpload: false,
        field: props.field,
      });
      expect(props.insertMedia).toHaveBeenCalledWith(
        ['uploads/one.jpg', 'uploads/two.jpg'],
        props.field,
      );
      expect(props.closeMediaLibrary).toHaveBeenCalledTimes(1);
      expect(event.target.value).toBeNull();
    });

    it('persists only the first selected file when multiple uploads are disabled', async () => {
      const { component, props } = createMediaLibrary({ allowMultiple: false, value: '' });
      const event = createEvent([createFile('one.jpg'), createFile('two.jpg')]);

      await component.handlePersist(event);

      expect(props.persistMedia).toHaveBeenCalledTimes(1);
      expect(props.insertMedia).not.toHaveBeenCalled();
      expect(component.setState).toHaveBeenCalledWith({ isPersisted: true });
      expect(component.scrollToTop).toHaveBeenCalledTimes(1);
      expect(event.target.value).toBeNull();
    });
  });
});
